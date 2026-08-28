"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import {
  CLUB_BALANCE_FUNDING_GROUP_KEY,
  fundingGroupKey,
  groupExpenseReportLinesByFundingSource,
} from "@/lib/expense-reports/expense-report-validation-grouping";
import { prisma } from "@/lib/prisma";
import {
  buildExpenseReportPdfPath,
  storedFileExists,
  writeStoredFile,
} from "@/lib/storage/file-storage";
import { getConventionPdfSettings } from "./convention-pdf-settings";
import {
  buildSoldePdfData,
  buildSubventionPdfData,
  type PdfBeneficiaryContext,
} from "./expense-report-pdf-data";
import { renderSoldePdf, renderSubventionPdf } from "./render-expense-report-pdf";
import { formatConventionDate } from "./subsidy-convention";

export type RegeneratePdfState = { ok: boolean; error?: string };

const NOT_FOUND_ERROR = "PDF introuvable.";
const NOT_FINALIZED_ERROR = "Cette Note de frais n'est pas encore validée.";
const FILE_STILL_PRESENT_ERROR =
  "Le fichier existe toujours sur le serveur, aucune reconstitution nécessaire.";
const REGENERATION_FAILED_ERROR = "La reconstitution du PDF a échoué.";

const formSchema = z.object({ pdfId: z.string().uuid() });

/**
 * Reconstitue le fichier d'un PDF final déjà généré mais disparu du disque
 * (perte de stockage) — jamais une correction : les données utilisées sont
 * exactement celles, immuables, de la Validation d'origine (Lignes,
 * Mouvements financiers), sans repasser par l'éditeur. Le document produit
 * est marqué comme une reconstitution (cf. buildSoldePdfData/
 * buildSubventionPdfData) : ce n'est pas prétendu être l'artefact original,
 * cf. discussion ADR-0003 (immutabilité post-PDF).
 *
 * Deux informations de l'original ne sont jamais récupérables : l'IBAN
 * (supprimé à la Validation, ADR-0002) et les éventuels paramètres de
 * convention PDF s'ils ont changé depuis (nom du Trésorier...).
 */
export async function regenerateExpenseReportPdfAction(
  _prevState: RegeneratePdfState,
  formData: FormData,
): Promise<RegeneratePdfState> {
  await requireAdmin();

  const parsed = formSchema.safeParse({ pdfId: formData.get("pdfId") });
  if (!parsed.success) {
    return { ok: false, error: NOT_FOUND_ERROR };
  }

  const pdf = await prisma.expenseReportPdf.findUnique({
    where: { id: parsed.data.pdfId },
    select: {
      id: true,
      filePath: true,
      fundingSource: true,
      subventionId: true,
      expenseReport: {
        select: {
          id: true,
          status: true,
          finalizedAt: true,
          assoId: true,
          beneficiaryFirstname: true,
          beneficiaryLastname: true,
          asso: { select: { slug: true, name: true } },
          lines: {
            select: {
              id: true,
              amountCents: true,
              expenseDate: true,
              expenseName: true,
              fundingSource: true,
              subventionId: true,
            },
          },
        },
      },
    },
  });
  if (!pdf) {
    return { ok: false, error: NOT_FOUND_ERROR };
  }

  const report = pdf.expenseReport;
  if (report.status !== "FINALIZED" || !report.finalizedAt) {
    return { ok: false, error: NOT_FINALIZED_ERROR };
  }

  if (await storedFileExists(pdf.filePath)) {
    return { ok: false, error: FILE_STILL_PRESENT_ERROR };
  }

  const fundingGroups = groupExpenseReportLinesByFundingSource(report.lines);
  const expectedKey =
    pdf.fundingSource === "CLUB_BALANCE"
      ? CLUB_BALANCE_FUNDING_GROUP_KEY
      : (pdf.subventionId as string);
  const group = fundingGroups.find(
    (candidate) => fundingGroupKey(candidate) === expectedKey,
  );
  if (!group) {
    console.error(
      "[regenerateExpenseReportPdfAction] groupe de financement introuvable",
      {
        pdfId: pdf.id,
        expectedKey,
        availableKeys: fundingGroups.map(fundingGroupKey),
      },
    );
    return { ok: false, error: REGENERATION_FAILED_ERROR };
  }

  const settings = await getConventionPdfSettings();
  const context: PdfBeneficiaryContext = {
    // Fidèle à l'original (calculé à `new Date()` au moment de la
    // Validation, jamais figé) : `finalizedAt` est le seul point dans le
    // temps immuable dont on dispose encore.
    reportDate: report.finalizedAt,
    beneficiaryName:
      `${report.beneficiaryFirstname ?? ""} ${report.beneficiaryLastname ?? ""}`.trim(),
    associationName: report.asso.name,
    // Supprimé à la Validation (ADR-0002) : irrécupérable pour une
    // reconstitution, contrairement au reste des données financières.
    iban: null,
    treasurerName: settings.claTreasurerName,
    reconstitutionNote: `Document reconstitué le ${formatConventionDate(new Date())} suite à la perte du fichier original.`,
  };

  let buffer: Buffer;
  try {
    if (group.kind === "CLUB_BALANCE") {
      buffer = await renderSoldePdf(
        buildSoldePdfData({
          context,
          lines: group.lines.map((line) => ({
            amountCents: line.amountCents,
            date: line.expenseDate,
            description: line.expenseName,
          })),
        }),
      );
    } else {
      const subvention = await prisma.subvention.findUniqueOrThrow({
        where: { id: group.subventionId },
        select: {
          reason: true,
          campaignId: true,
          campaign: { select: { name: true, publicationDate: true } },
        },
      });

      const [campaignSubventions, reimbursedMovements] = await Promise.all([
        prisma.subvention.findMany({
          where: { campaignId: subvention.campaignId, assoId: report.assoId },
          select: { reason: true, amountCents: true },
        }),
        // Historique tel qu'il existait au moment de cette Validation : on
        // exclut les Lignes de cette Note elle-même (comptées à part, dans
        // linesToReimburse) et tout Mouvement postérieur à sa finalisation
        // (une autre Note validée depuis, sur la même Subvention).
        prisma.financialMovement.findMany({
          where: {
            accountType: "SUBVENTION",
            origin: "EXPENSE_REPORT",
            subventionId: group.subventionId,
            createdAt: { lte: report.finalizedAt },
            expenseReportLine: { expenseReportId: { not: report.id } },
          },
          select: {
            amountCents: true,
            createdAt: true,
            expenseReportLine: { select: { expenseName: true } },
          },
        }),
      ]);

      buffer = await renderSubventionPdf(
        buildSubventionPdfData({
          context,
          campaignName: subvention.campaign.name,
          grantReason: subvention.reason,
          campaignGrantedOn: subvention.campaign.publicationDate as Date,
          campaignSubventions,
          reimbursedHistory: reimbursedMovements.map((movement) => ({
            amountCents: movement.amountCents,
            date: movement.createdAt,
            description: movement.expenseReportLine!.expenseName,
          })),
          linesToReimburse: group.lines.map((line) => ({
            amountCents: line.amountCents,
            date: line.expenseDate,
            description: line.expenseName,
          })),
        }),
      );
    }
  } catch (error) {
    console.error("[regenerateExpenseReportPdfAction] échec du rendu PDF", error);
    return { ok: false, error: REGENERATION_FAILED_ERROR };
  }

  const relativePath = buildExpenseReportPdfPath({
    assoSlug: report.asso.slug,
    reportId: report.id,
    extension: "pdf",
  });

  try {
    await writeStoredFile(relativePath, buffer);
  } catch (error) {
    console.error(
      "[regenerateExpenseReportPdfAction] échec de l'écriture du fichier",
      error,
    );
    return { ok: false, error: REGENERATION_FAILED_ERROR };
  }

  await prisma.expenseReportPdf.update({
    where: { id: pdf.id },
    data: { filePath: relativePath },
  });

  revalidatePath(`/app/admin/notes-de-frais/${report.id}`);

  return { ok: true };
}
