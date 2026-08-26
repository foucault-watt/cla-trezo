"use server";

import { revalidatePath } from "next/cache";
import type {
  FinancialAccountType,
  FundingSourceType,
} from "@/app/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth/guards";
import {
  assertExpenseReportTransition,
  ExpenseReportLifecycleError,
} from "@/lib/expense-reports/expense-report-lifecycle";
import {
  fundingGroupKey,
  groupExpenseReportLinesByFundingSource,
} from "@/lib/expense-reports/expense-report-validation-grouping";
import { prisma } from "@/lib/prisma";
import {
  buildExpenseReportPdfPath,
  deleteStoredFile,
  writeStoredFile,
} from "@/lib/storage/file-storage";
import { expenseReportPdfDataSchema } from "@/pdf-lab/templates/ndf-fn-sb/schema";
import type { ExpenseReportPdfData } from "@/pdf-lab/templates/ndf-fn-sb/types";
import { expenseBalancePdfDataSchema } from "@/pdf-lab/templates/ndf-solde/schema";
import type { ExpenseBalancePdfData } from "@/pdf-lab/templates/ndf-solde/types";
import { renderSoldePdf, renderSubventionPdf } from "./render-expense-report-pdf";

export type ValidateExpenseReportGroupInput =
  | { kind: "SUBVENTION"; subventionId: string; data: unknown }
  | { kind: "CLUB_BALANCE"; data: unknown };

type ValidatedExpenseReportGroup =
  | { kind: "SUBVENTION"; subventionId: string; data: ExpenseReportPdfData }
  | { kind: "CLUB_BALANCE"; data: ExpenseBalancePdfData };

export type ValidateExpenseReportState = { ok: boolean; error?: string };

const INVALID_DOCUMENTS_ERROR =
  "Les documents envoyés ne correspondent pas aux Lignes de cette Note.";
const GENERATION_FAILED_ERROR = "La génération du PDF a échoué.";
const VALIDATION_FAILED_ERROR = "La validation a échoué.";
const NOT_PENDING_ERROR =
  "Cette Note de frais n'est pas en attente de validation.";

/**
 * Valide une Note de frais Prise en charge (issue #20) : génère un PDF final
 * par source de financement distincte (ADR-0006), enregistre un mouvement
 * financier par Ligne, supprime l'IBAN (ADR-0002) et passe la Note à
 * Validée — le tout dans une unique transaction. `groups` porte les données
 * de chaque PDF telles qu'éventuellement éditées par l'Admin dans l'aperçu ;
 * elles ne pilotent jamais les mouvements financiers, toujours calculés à
 * partir des vraies Lignes rechargées ici.
 */
export async function validateExpenseReportAction(
  reportId: string,
  groups: ValidateExpenseReportGroupInput[],
): Promise<ValidateExpenseReportState> {
  const admin = await requireAdmin();

  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      assoId: true,
      status: true,
      asso: { select: { slug: true } },
      lines: {
        select: {
          id: true,
          amountCents: true,
          fundingSource: true,
          subventionId: true,
        },
      },
    },
  });
  if (!report) {
    return { ok: false, error: "Note de frais introuvable." };
  }

  try {
    assertExpenseReportTransition({
      from: report.status,
      to: "FINALIZED",
      actor: { type: "ADMIN" },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return { ok: false, error: NOT_PENDING_ERROR };
  }

  const canonicalGroups = groupExpenseReportLinesByFundingSource(report.lines);
  const canonicalKeys = new Set(canonicalGroups.map(fundingGroupKey));
  const submittedKeys = new Set(groups.map(fundingGroupKey));
  const keysMatch =
    groups.length === canonicalGroups.length &&
    submittedKeys.size === groups.length &&
    [...canonicalKeys].every((key) => submittedKeys.has(key));
  if (!keysMatch) {
    return { ok: false, error: INVALID_DOCUMENTS_ERROR };
  }

  const validatedGroups: ValidatedExpenseReportGroup[] = [];
  for (const group of groups) {
    if (group.kind === "SUBVENTION") {
      const parsed = expenseReportPdfDataSchema.safeParse(group.data);
      if (!parsed.success) return { ok: false, error: INVALID_DOCUMENTS_ERROR };
      validatedGroups.push({
        kind: "SUBVENTION",
        subventionId: group.subventionId,
        data: parsed.data,
      });
    } else {
      const parsed = expenseBalancePdfDataSchema.safeParse(group.data);
      if (!parsed.success) return { ok: false, error: INVALID_DOCUMENTS_ERROR };
      validatedGroups.push({ kind: "CLUB_BALANCE", data: parsed.data });
    }
  }

  const writtenFiles: {
    fundingSource: FundingSourceType;
    subventionId: string | null;
    relativePath: string;
  }[] = [];

  try {
    for (const group of validatedGroups) {
      const buffer =
        group.kind === "SUBVENTION"
          ? await renderSubventionPdf(group.data)
          : await renderSoldePdf(group.data);
      const relativePath = buildExpenseReportPdfPath({
        assoSlug: report.asso.slug,
        reportId: report.id,
        extension: "pdf",
      });
      await writeStoredFile(relativePath, buffer);
      writtenFiles.push({
        fundingSource: group.kind,
        subventionId: group.kind === "SUBVENTION" ? group.subventionId : null,
        relativePath,
      });
    }
  } catch {
    await Promise.allSettled(
      writtenFiles.map((file) => deleteStoredFile(file.relativePath)),
    );
    return { ok: false, error: GENERATION_FAILED_ERROR };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.expenseReport.findUnique({
        where: { id: report.id },
        select: { status: true },
      });
      if (!fresh) {
        throw new ExpenseReportLifecycleError("Cette Note de frais n'existe plus.");
      }
      assertExpenseReportTransition({
        from: fresh.status,
        to: "FINALIZED",
        actor: { type: "ADMIN" },
      });

      await tx.financialMovement.createMany({
        data: report.lines.map((line) => ({
          assoId: report.assoId,
          movementType: "DEBIT",
          accountType: line.fundingSource as FinancialAccountType,
          origin: "EXPENSE_REPORT",
          amountCents: line.amountCents,
          subventionId:
            line.fundingSource === "SUBVENTION" ? line.subventionId : null,
          expenseReportLineId: line.id,
          createdBy: admin.id,
        })),
      });

      await tx.expenseReportPdf.createMany({
        data: writtenFiles.map((file) => ({
          expenseReportId: report.id,
          fundingSource: file.fundingSource,
          subventionId: file.subventionId,
          filePath: file.relativePath,
        })),
      });

      await tx.expenseReport.update({
        where: { id: report.id },
        data: {
          status: "FINALIZED",
          finalizedAt: new Date(),
          beneficiaryIban: null,
        },
      });
    });
  } catch (error) {
    await Promise.allSettled(
      writtenFiles.map((file) => deleteStoredFile(file.relativePath)),
    );
    if (error instanceof ExpenseReportLifecycleError) {
      return { ok: false, error: NOT_PENDING_ERROR };
    }
    return { ok: false, error: VALIDATION_FAILED_ERROR };
  }

  revalidatePath(`/app/admin/notes-de-frais/${report.id}`);
  revalidatePath("/app/admin/notes-de-frais");

  return { ok: true };
}
