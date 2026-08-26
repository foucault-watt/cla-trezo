"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import {
  assertExpenseReportMutable,
  assertExpenseReportTransition,
  ExpenseReportLifecycleError,
} from "@/lib/expense-reports/expense-report-lifecycle";
import {
  loadFundingSourceEligibility,
  rawLineFormValues,
  type ExpenseReportLineDeleteState,
  type ExpenseReportLineFormState,
} from "@/lib/expense-reports/expense-report-line-shared";
import { resolveExpenseReportBeneficiary } from "@/lib/expense-reports/expense-report-actions";
import { loadExpenseLineWarnings } from "@/lib/expense-reports/line-warnings";
import { toAmountCents } from "@/lib/money";
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

export type UpdateExpenseReportAsAdminState = { ok: boolean; error?: string };

/**
 * Équivalent Admin de updateExpenseReportAction
 * (lib/expense-reports/expense-report-actions.ts) : mêmes règles, sans
 * scoping par assoSlug (l'Admin n'est rattaché à aucune Structure).
 */
export async function updateExpenseReportAsAdminAction(
  _prevState: UpdateExpenseReportAsAdminState,
  formData: FormData,
): Promise<UpdateExpenseReportAsAdminState> {
  const parsed = parseUpdateExpenseReportAsAdminForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  await requireAdmin();
  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, status: true },
  });
  if (!report) return { ok: false, error: "Note de frais introuvable." };
  try {
    assertExpenseReportMutable({
      status: report.status,
      actor: { type: "ADMIN" },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return { ok: false, error: "Cette Note de frais n'est plus modifiable." };
  }

  await prisma.expenseReport.update({
    where: { id: report.id },
    data: { title: parsed.data.title, description: parsed.data.description },
  });
  revalidatePath(`/app/admin/notes-de-frais/${report.id}`);
  return { ok: true };
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
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  await requireAdmin();
  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      assoId: true,
      status: true,
      beneficiaryUserId: true,
      beneficiaryFirstname: true,
      beneficiaryLastname: true,
      beneficiaryIban: true,
    },
  });
  if (!report) return { ok: false, error: "Note de frais introuvable." };
  try {
    assertExpenseReportMutable({
      status: report.status,
      actor: { type: "ADMIN" },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return { ok: false, error: "Cette Note de frais n'est plus modifiable." };
  }

  const resolved = await resolveExpenseReportBeneficiary({
    input: parsed.data,
    assoId: report.assoId,
    existing: report,
  });
  if (!resolved.ok) return resolved;
  const { beneficiary } = resolved;

  await prisma.expenseReport.update({
    where: { id: report.id },
    data: {
      beneficiaryUserId: beneficiary.userId,
      beneficiaryFirstname: beneficiary.firstname,
      beneficiaryLastname: beneficiary.lastname,
      beneficiaryIban: beneficiary.iban,
    },
  });
  revalidatePath(`/app/admin/notes-de-frais/${report.id}`);
  return { ok: true };
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
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

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
      actor: { type: "ADMIN" },
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

  revalidatePath(`/app/admin/notes-de-frais/${report.id}`);
  revalidatePath("/app/admin/notes-de-frais");

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
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

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
      actor: { type: "ADMIN" },
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
    data: { status: "REJECTED" },
  });

  revalidatePath(`/app/admin/notes-de-frais/${report.id}`);
  revalidatePath("/app/admin/notes-de-frais");

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
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

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

  revalidatePath("/app/admin/notes-de-frais");

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
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
      values,
    };
  }

  await requireAdmin();
  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.expenseReportId },
    select: { id: true, assoId: true, status: true },
  });
  if (!report)
    return { ok: false, error: "Note de frais introuvable.", values };
  try {
    assertExpenseReportMutable({
      status: report.status,
      actor: { type: "ADMIN" },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return {
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
      values,
    };
  }

  const eligibility = await loadFundingSourceEligibility({
    assoId: report.assoId,
    fundingSource: parsed.data.fundingSource,
    subventionId: parsed.data.subventionId,
  });
  if (!eligibility.ok) return { ok: false, error: eligibility.error, values };

  const amountCents = toAmountCents(parsed.data.amount);
  const warnings = await loadExpenseLineWarnings({
    assoId: report.assoId,
    expenseReportId: report.id,
    fundingSource: parsed.data.fundingSource,
    subventionId: parsed.data.subventionId,
    lineAmountCents: amountCents,
  });
  await prisma.expenseReportLine.create({
    data: {
      expenseReportId: report.id,
      expenseDate: parsed.data.expenseDate,
      amountCents,
      expenseName: parsed.data.expenseName,
      typeDepenseId: parsed.data.typeDepenseId,
      customLabel: parsed.data.customLabel,
      fundingSource: parsed.data.fundingSource,
      subventionId: parsed.data.subventionId,
    },
  });
  revalidatePath(`/app/admin/notes-de-frais/${report.id}`);
  return { ok: true, warnings };
}

export async function updateReimbursementAsAdminAction(
  _prevState: ReimbursementAsAdminState,
  formData: FormData,
): Promise<ReimbursementAsAdminState> {
  const values = rawLineFormValues(formData);
  const parsed = parseUpdateReimbursementAsAdminForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
      values,
    };
  }

  await requireAdmin();
  const line = await prisma.expenseReportLine.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      expenseReportId: true,
      expenseReport: { select: { assoId: true, status: true } },
    },
  });
  if (!line) return { ok: false, error: "Remboursement introuvable.", values };
  const report = line.expenseReport;
  try {
    assertExpenseReportMutable({
      status: report.status,
      actor: { type: "ADMIN" },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return {
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
      values,
    };
  }

  const eligibility = await loadFundingSourceEligibility({
    assoId: report.assoId,
    fundingSource: parsed.data.fundingSource,
    subventionId: parsed.data.subventionId,
  });
  if (!eligibility.ok) return { ok: false, error: eligibility.error, values };
  const amountCents = toAmountCents(parsed.data.amount);
  const warnings = await loadExpenseLineWarnings({
    assoId: report.assoId,
    expenseReportId: line.expenseReportId,
    fundingSource: parsed.data.fundingSource,
    subventionId: parsed.data.subventionId,
    lineAmountCents: amountCents,
    excludeLineId: line.id,
  });
  await prisma.expenseReportLine.update({
    where: { id: line.id },
    data: {
      expenseDate: parsed.data.expenseDate,
      amountCents,
      expenseName: parsed.data.expenseName,
      typeDepenseId: parsed.data.typeDepenseId,
      customLabel: parsed.data.customLabel,
      fundingSource: parsed.data.fundingSource,
      subventionId: parsed.data.subventionId,
    },
  });
  revalidatePath(`/app/admin/notes-de-frais/${line.expenseReportId}`);
  return { ok: true, warnings };
}

export const deleteReimbursementAsAdminAction =
  deleteExpenseReportLineAsAdminAction;

/**
 * Seule opération de suppression de Ligne de l'application (le Structure ne
 * peut que modifier, jamais supprimer) : réservée à l'Admin sur une Note déjà
 * Prise en charge (#18). Sans risque pour FinancialMovement (relation
 * optionnelle 1:1, jamais créée avant la Validation, cf. ADR-0003) puisqu'une
 * Note Prise en charge n'est jamais encore Validée.
 */
export async function deleteExpenseReportLineAsAdminAction(
  _prevState: DeleteExpenseReportLineAsAdminState,
  formData: FormData,
): Promise<DeleteExpenseReportLineAsAdminState> {
  const parsed = parseDeleteExpenseReportLineAsAdminForm(formData);
  if (!parsed.success) {
    return { ok: false, error: "Saisie invalide." };
  }

  await requireAdmin();

  const line = await prisma.expenseReportLine.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      expenseReportId: true,
      expenseReport: { select: { status: true } },
    },
  });
  if (!line) {
    return { ok: false, error: "Remboursement introuvable." };
  }
  try {
    assertExpenseReportMutable({
      status: line.expenseReport.status,
      actor: { type: "ADMIN" },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return { ok: false, error: "Cette Note de frais n'est plus modifiable." };
  }

  await prisma.expenseReportLine.delete({ where: { id: line.id } });

  revalidatePath(`/app/admin/notes-de-frais/${line.expenseReportId}`);

  return { ok: true };
}
