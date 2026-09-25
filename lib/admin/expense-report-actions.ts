"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import {
  addExpenseReportLine,
  deleteExpenseReportLine,
  revalidateExpenseReportScreens,
  updateExpenseReportBeneficiary,
  updateExpenseReportInfo,
  updateExpenseReportLine,
} from "@/lib/expense-reports/expense-report-commands";
import {
  assertExpenseReportTransition,
  ExpenseReportLifecycleError,
  type ExpenseReportActor,
} from "@/lib/expense-reports/expense-report-lifecycle";
import {
  rawLineFormValues,
  type ExpenseReportLineDeleteState,
  type ExpenseReportLineFormState,
} from "@/lib/expense-reports/expense-report-line-shared";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage/file-storage";
import {
  parseAddReimbursementAsAdminForm,
  parseDeleteExpenseReportAsAdminForm,
  parseDeleteExpenseReportLineAsAdminForm,
  parseRejectExpenseReportForm,
  parseTakeOverExpenseReportForm,
  parseUpdateExpenseReportAsAdminForm,
  parseUpdateExpenseReportBeneficiaryAsAdminForm,
  parseUpdateReimbursementAsAdminForm,
} from "./expense-report-input";

/*
 * Server Actions de l'espace Admin. Les modifications de contenu sont des
 * adapters vers expense-report-commands.ts, partagé avec la Structure — même
 * chargement, même règle de verrouillage (l'Admin ne modifie qu'une Note
 * Prise en charge, ADR-0001). Prise en charge, rejet et suppression n'existent
 * que côté Admin et vivent ici.
 */

const ADMIN: ExpenseReportActor = { type: "ADMIN" };

function invalid(parsed: { error: z.ZodError }) {
  return {
    ok: false as const,
    error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
  };
}

export type UpdateExpenseReportAsAdminState = { ok: boolean; error?: string };

export async function updateExpenseReportAsAdminAction(
  _prevState: UpdateExpenseReportAsAdminState,
  formData: FormData,
): Promise<UpdateExpenseReportAsAdminState> {
  const parsed = parseUpdateExpenseReportAsAdminForm(formData);
  if (!parsed.success) return invalid(parsed);

  await requireAdmin();
  return updateExpenseReportInfo(ADMIN, parsed.data);
}

export type UpdateExpenseReportBeneficiaryAsAdminState = {
  ok: boolean;
  error?: string;
};

export async function updateExpenseReportBeneficiaryAsAdminAction(
  _prevState: UpdateExpenseReportBeneficiaryAsAdminState,
  formData: FormData,
): Promise<UpdateExpenseReportBeneficiaryAsAdminState> {
  const parsed = parseUpdateExpenseReportBeneficiaryAsAdminForm(formData);
  if (!parsed.success) return invalid(parsed);

  await requireAdmin();
  return updateExpenseReportBeneficiary(ADMIN, parsed.data);
}

/**
 * Première action de l'Admin sur une Note de frais Soumise : la note passe
 * à Prise en charge et la Structure perd définitivement la main dessus
 * (cf. ADR-0001, verrouillage à sens unique, pas de retour en arrière).
 */
export type TakeOverExpenseReportState = { ok: boolean; error?: string };

export async function takeOverExpenseReportAction(
  _prevState: TakeOverExpenseReportState,
  formData: FormData,
): Promise<TakeOverExpenseReportState> {
  const admin = await requireAdmin();

  const parsed = parseTakeOverExpenseReportForm(formData);
  if (!parsed.success) return invalid(parsed);

  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, status: true },
  });
  if (!report) {
    return { ok: false, error: "Note de frais introuvable." };
  }
  try {
    assertExpenseReportTransition({
      from: report.status,
      to: "TAKEN_OVER",
      actor: ADMIN,
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return {
      ok: false,
      error: "Cette Note de frais n'est pas en attente de prise en charge.",
    };
  }

  await prisma.expenseReport.update({
    where: { id: report.id },
    data: {
      status: "TAKEN_OVER",
      takenByAdminId: admin.id,
      takenAt: new Date(),
    },
  });

  revalidateExpenseReportScreens();

  return { ok: true };
}

export type RejectExpenseReportState = { ok: boolean; error?: string };

/**
 * Refuse une Note Prise en charge (issue #20, hors périmètre initial) :
 * statut terminal, aucune transition sortante définie dans
 * ALLOWED_TRANSITIONS — donc non modifiable ensuite, sans code
 * supplémentaire à écrire pour ça (même raisonnement que l'immutabilité de
 * FINALIZED).
 */
export async function rejectExpenseReportAction(
  _prevState: RejectExpenseReportState,
  formData: FormData,
): Promise<RejectExpenseReportState> {
  await requireAdmin();

  const parsed = parseRejectExpenseReportForm(formData);
  if (!parsed.success) return invalid(parsed);

  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, status: true },
  });
  if (!report) {
    return { ok: false, error: "Note de frais introuvable." };
  }
  try {
    assertExpenseReportTransition({
      from: report.status,
      to: "REJECTED",
      actor: ADMIN,
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return {
      ok: false,
      error: "Cette Note de frais ne peut pas être rejetée.",
    };
  }

  await prisma.expenseReport.update({
    where: { id: report.id },
    data: { status: "REJECTED", rejectionReason: parsed.data.reason },
  });

  revalidateExpenseReportScreens();

  return { ok: true };
}

export type DeleteExpenseReportAsAdminState = { ok: boolean; error?: string };

/**
 * Supprime une Note de frais Admin, quel que soit son statut — y compris
 * Validée, sur demande explicite : contrairement à deleteExpenseReportAction
 * (Structure, limité au Brouillon), aucune restriction de statut ici. Purge
 * en cascade les FinancialMovement et ExpenseReportPdf liés avant la Note
 * elle-même (contraintes de clé étrangère), ce qui recalcule silencieusement
 * le Solde/les Subventions concernées comme si la Note n'avait jamais existé
 * — l'Admin a été prévenu dans la modale de confirmation, cf.
 * delete-expense-report-as-admin-button.tsx.
 */
export async function deleteExpenseReportAsAdminAction(
  _prevState: DeleteExpenseReportAsAdminState,
  formData: FormData,
): Promise<DeleteExpenseReportAsAdminState> {
  await requireAdmin();

  const parsed = parseDeleteExpenseReportAsAdminForm(formData);
  if (!parsed.success) return invalid(parsed);

  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      lines: { select: { id: true } },
      supportingDocuments: { select: { filePath: true } },
      pdfs: { select: { filePath: true } },
    },
  });
  if (!report) {
    return { ok: false, error: "Note de frais introuvable." };
  }

  const lineIds = report.lines.map((line) => line.id);

  await prisma.$transaction([
    prisma.financialMovement.deleteMany({
      where: { expenseReportLineId: { in: lineIds } },
    }),
    prisma.expenseReportPdf.deleteMany({
      where: { expenseReportId: report.id },
    }),
    prisma.expenseReportLine.deleteMany({
      where: { expenseReportId: report.id },
    }),
    prisma.supportingDocument.deleteMany({
      where: { expenseReportId: report.id },
    }),
    prisma.expenseReport.delete({ where: { id: report.id } }),
  ]);

  // Best-effort, en parallèle : la DB fait foi, un fichier orphelin est
  // toléré (même choix que deleteExpenseReportAction côté Structure).
  await Promise.allSettled([
    ...report.supportingDocuments.map((document) =>
      deleteStoredFile(document.filePath),
    ),
    ...report.pdfs.map((pdf) => deleteStoredFile(pdf.filePath)),
  ]);

  revalidateExpenseReportScreens();

  const toastParams = new URLSearchParams({
    toast: "Note de frais supprimée.",
    toastType: "success",
  });
  redirect(`/app/admin/notes-de-frais?${toastParams.toString()}`);
}

export type DeleteExpenseReportLineAsAdminState = ExpenseReportLineDeleteState;

export type ReimbursementAsAdminState = ExpenseReportLineFormState;

export async function addReimbursementAsAdminAction(
  _prevState: ReimbursementAsAdminState,
  formData: FormData,
): Promise<ReimbursementAsAdminState> {
  const values = rawLineFormValues(formData);
  const parsed = parseAddReimbursementAsAdminForm(formData);
  if (!parsed.success) return { ...invalid(parsed), values };

  await requireAdmin();
  const result = await addExpenseReportLine(ADMIN, parsed.data);
  return result.ok ? result : { ...result, values };
}

export async function updateReimbursementAsAdminAction(
  _prevState: ReimbursementAsAdminState,
  formData: FormData,
): Promise<ReimbursementAsAdminState> {
  const values = rawLineFormValues(formData);
  const parsed = parseUpdateReimbursementAsAdminForm(formData);
  if (!parsed.success) return { ...invalid(parsed), values };

  await requireAdmin();
  const result = await updateExpenseReportLine(ADMIN, parsed.data);
  return result.ok ? result : { ...result, values };
}

export async function deleteReimbursementAsAdminAction(
  _prevState: DeleteExpenseReportLineAsAdminState,
  formData: FormData,
): Promise<DeleteExpenseReportLineAsAdminState> {
  const parsed = parseDeleteExpenseReportLineAsAdminForm(formData);
  if (!parsed.success) return { ok: false, error: "Saisie invalide." };

  await requireAdmin();
  return deleteExpenseReportLine(ADMIN, parsed.data);
}
