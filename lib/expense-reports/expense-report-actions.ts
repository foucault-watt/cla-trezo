"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStructureAccess } from "@/lib/auth/guards";
import { toAmountCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage/file-storage";
import {
  EXPENSE_REPORT_STEPS,
  expenseReportStepHref,
} from "./expense-report-steps";
import {
  assertExpenseReportMutable,
  assertExpenseReportTransition,
  ExpenseReportLifecycleError,
} from "./expense-report-lifecycle";
import {
  loadFundingSourceEligibility,
  rawLineFormValues,
  type ExpenseReportLineFormState,
} from "./expense-report-line-shared";
import { loadExpenseLineWarnings } from "./line-warnings";
import {
  parseAddReimbursementForm,
  parseCreateExpenseReportForm,
  parseDeleteExpenseReportForm,
  parseSubmitExpenseReportForm,
  parseUpdateExpenseReportForm,
  parseUpdateExpenseReportBeneficiaryForm,
  parseUpdateReimbursementForm,
} from "./expense-report-input";
export type { ExpenseReportLineFormValues } from "./expense-report-line-shared";

function revalidateExpenseReportWizard(assoSlug: string, reportId: string) {
  const basePath = `/app/${assoSlug}/notes-de-frais/${reportId}`;
  revalidatePath(basePath);
  for (const step of EXPENSE_REPORT_STEPS) {
    revalidatePath(expenseReportStepHref(assoSlug, reportId, step));
  }
}

export type CreateExpenseReportState = {
  ok: boolean;
  error?: string;
  reportId?: string;
};

export async function createExpenseReportAction(
  _prevState: CreateExpenseReportState,
  formData: FormData,
): Promise<CreateExpenseReportState> {
  const parsed = parseCreateExpenseReportForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const { structure, user } = await requireStructureAccess(
    parsed.data.assoSlug,
  );

  const report = await prisma.expenseReport.create({
    data: {
      assoId: structure.assoId,
      createdBy: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });

  revalidatePath(`/app/${parsed.data.assoSlug}/notes-de-frais`);

  return { ok: true, reportId: report.id };
}

export type UpdateExpenseReportState = { ok: boolean; error?: string };

export async function updateExpenseReportAction(
  _prevState: UpdateExpenseReportState,
  formData: FormData,
): Promise<UpdateExpenseReportState> {
  const parsed = parseUpdateExpenseReportForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const { structure } = await requireStructureAccess(parsed.data.assoSlug);

  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, assoId: true, status: true },
  });
  if (!report || report.assoId !== structure.assoId) {
    return { ok: false, error: "Note de frais introuvable." };
  }
  try {
    assertExpenseReportMutable({
      status: report.status,
      actor: { type: "STRUCTURE", assoId: structure.assoId },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return { ok: false, error: "Cette Note de frais n'est plus modifiable." };
  }

  await prisma.expenseReport.update({
    where: { id: report.id },
    data: { title: parsed.data.title, description: parsed.data.description },
  });

  revalidateExpenseReportWizard(parsed.data.assoSlug, report.id);

  return { ok: true };
}

export type SubmitExpenseReportState = { ok: boolean; error?: string };

export async function submitExpenseReportAction(
  _prevState: SubmitExpenseReportState,
  formData: FormData,
): Promise<SubmitExpenseReportState> {
  const parsed = parseSubmitExpenseReportForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const { structure } = await requireStructureAccess(parsed.data.assoSlug);

  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      assoId: true,
      status: true,
      beneficiaryFirstname: true,
      beneficiaryLastname: true,
      beneficiaryIban: true,
    },
  });
  if (!report || report.assoId !== structure.assoId) {
    return { ok: false, error: "Note de frais introuvable." };
  }

  try {
    assertExpenseReportTransition({
      from: report.status,
      to: "SUBMITTED",
      actor: { type: "STRUCTURE", assoId: structure.assoId },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return {
      ok: false,
      error: "Cette Note de frais n'est plus en Brouillon.",
    };
  }

  if (
    !report.beneficiaryFirstname ||
    !report.beneficiaryLastname ||
    !report.beneficiaryIban
  ) {
    return {
      ok: false,
      error:
        "Choisissez un bénéficiaire et renseignez son IBAN avant de soumettre.",
    };
  }

  const [lineCount, allLineCount] = await Promise.all([
    prisma.expenseReportLine.count({
      where: { expenseReportId: report.id, expenseDate: { not: null } },
    }),
    prisma.expenseReportLine.count({
      where: { expenseReportId: report.id },
    }),
  ]);
  if (lineCount === 0 || lineCount !== allLineCount) {
    return {
      ok: false,
      error: "Ajoutez au moins un Remboursement daté avant de soumettre.",
    };
  }

  const documentCount = await prisma.supportingDocument.count({
    where: { expenseReportId: report.id },
  });
  if (documentCount === 0) {
    return {
      ok: false,
      error:
        "Ajoutez au moins un Justificatif ou une Attestation sur l'honneur avant de soumettre.",
    };
  }

  await prisma.expenseReport.update({
    where: { id: report.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  revalidateExpenseReportWizard(parsed.data.assoSlug, report.id);

  return { ok: true };
}

export type DeleteExpenseReportState = { ok: boolean; error?: string };

/**
 * Supprime une Note de frais et son contenu (Lignes, Justificatifs). Limité
 * au statut Brouillon — plus strict que assertExpenseReportMutable (qui
 * autorise aussi Soumise) : une suppression est irréversible, contrairement
 * aux autres modifications de ce statut.
 */
export async function deleteExpenseReportAction(
  _prevState: DeleteExpenseReportState,
  formData: FormData,
): Promise<DeleteExpenseReportState> {
  const parsed = parseDeleteExpenseReportForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const { structure } = await requireStructureAccess(parsed.data.assoSlug);

  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      assoId: true,
      status: true,
      supportingDocuments: { select: { filePath: true } },
    },
  });
  if (!report || report.assoId !== structure.assoId) {
    return { ok: false, error: "Note de frais introuvable." };
  }
  if (report.status !== "DRAFT") {
    return {
      ok: false,
      error: "Seul un Brouillon peut être supprimé.",
    };
  }

  await prisma.$transaction([
    prisma.expenseReportLine.deleteMany({
      where: { expenseReportId: report.id },
    }),
    prisma.supportingDocument.deleteMany({
      where: { expenseReportId: report.id },
    }),
    prisma.expenseReport.delete({ where: { id: report.id } }),
  ]);

  // Best-effort, en parallèle : la DB fait foi, un fichier orphelin est
  // toléré (pas de purge automatique en V1, cf. addSupportingDocumentsAction).
  await Promise.allSettled(
    report.supportingDocuments.map((document) =>
      deleteStoredFile(document.filePath),
    ),
  );

  revalidatePath(`/app/${parsed.data.assoSlug}/notes-de-frais`);

  return { ok: true };
}

export type ReimbursementFormState = ExpenseReportLineFormState;

export async function addReimbursementAction(
  _prevState: ReimbursementFormState,
  formData: FormData,
): Promise<ReimbursementFormState> {
  const values = rawLineFormValues(formData);
  const parsed = parseAddReimbursementForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
      values,
    };
  }

  const { structure } = await requireStructureAccess(parsed.data.assoSlug);
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
  if (!report || report.assoId !== structure.assoId) {
    return { ok: false, error: "Note de frais introuvable.", values };
  }
  try {
    assertExpenseReportMutable({
      status: report.status,
      actor: { type: "STRUCTURE", assoId: structure.assoId },
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
    assoId: structure.assoId,
    fundingSource: parsed.data.fundingSource,
    subventionId: parsed.data.subventionId,
  });
  if (!eligibility.ok) return { ok: false, error: eligibility.error, values };

  const amountCents = toAmountCents(parsed.data.amount);
  const warnings = await loadExpenseLineWarnings({
    assoId: structure.assoId,
    expenseReportId: report.id,
    fundingSource: parsed.data.fundingSource,
    subventionId: parsed.data.subventionId,
    lineAmountCents: amountCents,
  });

  await prisma.expenseReportLine.create({
    data: {
      expenseReportId: report.id,
      beneficiaryFirstname: report.beneficiaryFirstname ?? "",
      beneficiaryLastname: report.beneficiaryLastname ?? "",
      iban: report.beneficiaryIban,
      expenseDate: parsed.data.expenseDate,
      amountCents,
      expenseName: parsed.data.expenseName,
      typeDepenseId: parsed.data.typeDepenseId,
      customLabel: parsed.data.customLabel,
      fundingSource: parsed.data.fundingSource,
      subventionId: parsed.data.subventionId,
    },
  });
  revalidateExpenseReportWizard(parsed.data.assoSlug, report.id);
  return { ok: true, warnings };
}

export async function updateReimbursementAction(
  _prevState: ReimbursementFormState,
  formData: FormData,
): Promise<ReimbursementFormState> {
  const values = rawLineFormValues(formData);
  const parsed = parseUpdateReimbursementForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
      values,
    };
  }
  const { structure } = await requireStructureAccess(parsed.data.assoSlug);
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
  if (!line || line.expenseReport.assoId !== structure.assoId) {
    return { ok: false, error: "Remboursement introuvable.", values };
  }
  try {
    assertExpenseReportMutable({
      status: line.expenseReport.status,
      actor: { type: "STRUCTURE", assoId: structure.assoId },
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
    assoId: structure.assoId,
    fundingSource: parsed.data.fundingSource,
    subventionId: parsed.data.subventionId,
  });
  if (!eligibility.ok) return { ok: false, error: eligibility.error, values };

  const amountCents = toAmountCents(parsed.data.amount);
  const warnings = await loadExpenseLineWarnings({
    assoId: structure.assoId,
    expenseReportId: line.expenseReportId,
    fundingSource: parsed.data.fundingSource,
    subventionId: parsed.data.subventionId,
    lineAmountCents: amountCents,
    excludeLineId: line.id,
  });
  await prisma.expenseReportLine.update({
    where: { id: line.id },
    data: {
      beneficiaryFirstname: line.expenseReport.beneficiaryFirstname ?? "",
      beneficiaryLastname: line.expenseReport.beneficiaryLastname ?? "",
      iban: line.expenseReport.beneficiaryIban,
      expenseDate: parsed.data.expenseDate,
      amountCents,
      expenseName: parsed.data.expenseName,
      typeDepenseId: parsed.data.typeDepenseId,
      customLabel: parsed.data.customLabel,
      fundingSource: parsed.data.fundingSource,
      subventionId: parsed.data.subventionId,
    },
  });
  revalidateExpenseReportWizard(parsed.data.assoSlug, line.expenseReportId);
  return { ok: true, warnings };
}

export type DeleteReimbursementState = { ok: boolean; error?: string };

export async function deleteReimbursementAction(
  _prevState: DeleteReimbursementState,
  formData: FormData,
): Promise<DeleteReimbursementState> {
  const id = String(formData.get("id") ?? "");
  const assoSlug = String(formData.get("assoSlug") ?? "");
  if (!z.string().uuid().safeParse(id).success || !assoSlug) {
    return { ok: false, error: "Saisie invalide." };
  }
  const { structure } = await requireStructureAccess(assoSlug);
  const line = await prisma.expenseReportLine.findUnique({
    where: { id },
    select: {
      id: true,
      expenseReportId: true,
      expenseReport: { select: { assoId: true, status: true } },
    },
  });
  if (!line || line.expenseReport.assoId !== structure.assoId) {
    return { ok: false, error: "Remboursement introuvable." };
  }
  try {
    assertExpenseReportMutable({
      status: line.expenseReport.status,
      actor: { type: "STRUCTURE", assoId: structure.assoId },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return { ok: false, error: "Cette Note de frais n'est plus modifiable." };
  }
  await prisma.expenseReportLine.delete({ where: { id: line.id } });
  revalidateExpenseReportWizard(assoSlug, line.expenseReportId);
  return { ok: true };
}

export type UpdateExpenseReportBeneficiaryState = {
  ok: boolean;
  error?: string;
};

export async function updateExpenseReportBeneficiaryAction(
  _prevState: UpdateExpenseReportBeneficiaryState,
  formData: FormData,
): Promise<UpdateExpenseReportBeneficiaryState> {
  const parsed = parseUpdateExpenseReportBeneficiaryForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }
  const { structure } = await requireStructureAccess(parsed.data.assoSlug);
  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, assoId: true, status: true, beneficiaryIban: true },
  });
  if (!report || report.assoId !== structure.assoId) {
    return { ok: false, error: "Note de frais introuvable." };
  }
  try {
    assertExpenseReportMutable({
      status: report.status,
      actor: { type: "STRUCTURE", assoId: structure.assoId },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return { ok: false, error: "Cette Note de frais n'est plus modifiable." };
  }

  let beneficiaryUserId: string | null = null;
  let firstname = parsed.data.beneficiaryFirstname;
  let lastname = parsed.data.beneficiaryLastname;
  if (parsed.data.beneficiaryKind === "MEMBER") {
    const membership = await prisma.refAssoUser.findFirst({
      where: {
        assoId: structure.assoId,
        userId: parsed.data.beneficiaryUserId as string,
        isActive: true,
      },
      select: {
        userId: true,
        user: { select: { firstname: true, lastname: true } },
      },
    });
    if (!membership)
      return { ok: false, error: "Membre introuvable ou inactif." };
    beneficiaryUserId = membership.userId;
    firstname = membership.user.firstname;
    lastname = membership.user.lastname;
  }
  const iban = parsed.data.beneficiaryIban || report.beneficiaryIban;
  if (!iban) return { ok: false, error: "L'IBAN est obligatoire." };

  await prisma.$transaction([
    prisma.expenseReport.update({
      where: { id: report.id },
      data: {
        beneficiaryUserId,
        beneficiaryFirstname: firstname,
        beneficiaryLastname: lastname,
        beneficiaryIban: iban,
      },
    }),
    prisma.expenseReportLine.updateMany({
      where: { expenseReportId: report.id },
      data: {
        beneficiaryFirstname: firstname,
        beneficiaryLastname: lastname,
        iban,
      },
    }),
  ]);
  revalidateExpenseReportWizard(parsed.data.assoSlug, report.id);
  return { ok: true };
}
