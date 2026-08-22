"use server";

import { revalidatePath } from "next/cache";
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
import { loadExpenseLineWarnings } from "@/lib/expense-reports/line-warnings";
import { toAmountCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import {
  parseAddExpenseReportLineAsAdminForm,
  parseAddReimbursementAsAdminForm,
  parseDeleteExpenseReportLineAsAdminForm,
  parseTakeOverExpenseReportForm,
  parseUpdateExpenseReportLineAsAdminForm,
  parseUpdateExpenseReportBeneficiaryAsAdminForm,
  parseUpdateReimbursementAsAdminForm,
} from "./expense-report-input";

/**
 * Une Note historique (créée avant la migration bénéficiaire unique) peut
 * n'avoir aucun bénéficiaire propre au niveau de la Note — seulement au
 * niveau de ses Lignes, cf. legacyMultiBeneficiary. L'Admin ne peut alors
 * pas y ajouter/modifier un Remboursement unique (T18).
 */
function hasSingleBeneficiary<
  T extends {
    beneficiaryFirstname: string | null;
    beneficiaryLastname: string | null;
    beneficiaryIban: string | null;
  },
>(
  report: T,
): report is T & {
  beneficiaryFirstname: string;
  beneficiaryLastname: string;
  beneficiaryIban: string;
} {
  return Boolean(
    report.beneficiaryFirstname &&
    report.beneficiaryLastname &&
    report.beneficiaryIban,
  );
}

export type TakeOverExpenseReportState = { ok: boolean; error?: string };

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

  await prisma.$transaction([
    prisma.expenseReport.update({
      where: { id: report.id },
      data: {
        beneficiaryUserId: null,
        beneficiaryFirstname: parsed.data.beneficiaryFirstname,
        beneficiaryLastname: parsed.data.beneficiaryLastname,
        beneficiaryIban: parsed.data.beneficiaryIban,
      },
    }),
    prisma.expenseReportLine.updateMany({
      where: { expenseReportId: report.id },
      data: {
        beneficiaryFirstname: parsed.data.beneficiaryFirstname,
        beneficiaryLastname: parsed.data.beneficiaryLastname,
        iban: parsed.data.beneficiaryIban,
      },
    }),
  ]);
  revalidatePath(`/app/admin/notes-de-frais/${report.id}`);
  return { ok: true };
}

/**
 * Première action de l'Admin sur une Note de frais Soumise : la note passe
 * à Prise en charge et la Structure perd définitivement la main dessus
 * (cf. ADR-0001, verrouillage à sens unique, pas de retour en arrière).
 */
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

export type AddExpenseReportLineAsAdminState = ExpenseReportLineFormState;

/**
 * Équivalent Admin de l'ancien ajout de Ligne côté Structure (architecture
 * multi-bénéficiaire) : mêmes règles d'éligibilité (T11) et de Warnings
 * (T13-T15, réévalués à chaque rendu via attachLineWarnings, cf. #18), mais
 * réservé à une Note déjà Prise en charge et sans scoping par assoSlug
 * (l'Admin n'est rattaché à aucune Structure).
 */
export async function addExpenseReportLineAsAdminAction(
  _prevState: AddExpenseReportLineAsAdminState,
  formData: FormData,
): Promise<AddExpenseReportLineAsAdminState> {
  const values = rawLineFormValues(formData);

  const parsed = parseAddExpenseReportLineAsAdminForm(formData);
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
  if (!report) {
    return { ok: false, error: "Note de frais introuvable.", values };
  }
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
  if (!eligibility.ok) {
    return { ok: false, error: eligibility.error, values };
  }

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
      beneficiaryFirstname: parsed.data.beneficiaryFirstname,
      beneficiaryLastname: parsed.data.beneficiaryLastname,
      iban: parsed.data.iban,
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

export type UpdateExpenseReportLineAsAdminState = ExpenseReportLineFormState;

/**
 * Équivalent Admin de l'ancienne modification de Ligne côté Structure
 * (architecture multi-bénéficiaire). Les Warnings renvoyés reflètent déjà
 * l'état post-modification (cf. loadExpenseLineWarnings) ;
 * la lecture de la page (attachLineWarnings) les recalcule aussi à chaque
 * rendu pour les autres Lignes de la même source, jamais stockés (#18).
 */
export async function updateExpenseReportLineAsAdminAction(
  _prevState: UpdateExpenseReportLineAsAdminState,
  formData: FormData,
): Promise<UpdateExpenseReportLineAsAdminState> {
  const values = rawLineFormValues(formData);

  const parsed = parseUpdateExpenseReportLineAsAdminForm(formData);
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
  if (!line) {
    return { ok: false, error: "Remboursement introuvable.", values };
  }
  try {
    assertExpenseReportMutable({
      status: line.expenseReport.status,
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
    assoId: line.expenseReport.assoId,
    fundingSource: parsed.data.fundingSource,
    subventionId: parsed.data.subventionId,
  });
  if (!eligibility.ok) {
    return { ok: false, error: eligibility.error, values };
  }

  const amountCents = toAmountCents(parsed.data.amount);
  const warnings = await loadExpenseLineWarnings({
    assoId: line.expenseReport.assoId,
    expenseReportId: line.expenseReportId,
    fundingSource: parsed.data.fundingSource,
    subventionId: parsed.data.subventionId,
    lineAmountCents: amountCents,
    excludeLineId: line.id,
  });

  await prisma.expenseReportLine.update({
    where: { id: line.id },
    data: {
      beneficiaryFirstname: parsed.data.beneficiaryFirstname,
      beneficiaryLastname: parsed.data.beneficiaryLastname,
      iban: parsed.data.iban,
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
    select: {
      id: true,
      assoId: true,
      status: true,
      beneficiaryFirstname: true,
      beneficiaryLastname: true,
      beneficiaryIban: true,
    },
  });
  if (!report)
    return { ok: false, error: "Note de frais introuvable.", values };
  if (!hasSingleBeneficiary(report)) {
    return {
      ok: false,
      error: "Cette ancienne Note n'a pas de bénéficiaire unique.",
      values,
    };
  }
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
      beneficiaryFirstname: report.beneficiaryFirstname,
      beneficiaryLastname: report.beneficiaryLastname,
      iban: report.beneficiaryIban,
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
      expenseReport: {
        select: {
          assoId: true,
          status: true,
          beneficiaryFirstname: true,
          beneficiaryLastname: true,
          beneficiaryIban: true,
        },
      },
    },
  });
  if (!line) return { ok: false, error: "Remboursement introuvable.", values };
  const report = line.expenseReport;
  if (!hasSingleBeneficiary(report)) {
    return {
      ok: false,
      error: "Cette ancienne Note n'a pas de bénéficiaire unique.",
      values,
    };
  }
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
      beneficiaryFirstname: report.beneficiaryFirstname,
      beneficiaryLastname: report.beneficiaryLastname,
      iban: report.beneficiaryIban,
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
