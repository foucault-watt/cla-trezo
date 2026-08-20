"use server";

import { revalidatePath } from "next/cache";
import { requireStructureAccess } from "@/lib/auth/guards";
import { toAmountCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
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
  parseAddExpenseReportLineForm,
  parseCreateExpenseReportForm,
  parseSubmitExpenseReportForm,
  parseUpdateExpenseReportForm,
  parseUpdateExpenseReportLineForm,
} from "./expense-report-input";
export type { ExpenseReportLineFormValues } from "./expense-report-line-shared";

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

  revalidatePath(
    `/app/${parsed.data.assoSlug}/notes-de-frais/${report.id}`,
  );

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
    select: { id: true, assoId: true, status: true },
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

  const lineCount = await prisma.expenseReportLine.count({
    where: { expenseReportId: report.id },
  });
  if (lineCount === 0) {
    return {
      ok: false,
      error: "Ajoutez au moins une Ligne avant de soumettre.",
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

  revalidatePath(`/app/${parsed.data.assoSlug}/notes-de-frais/${report.id}`);

  return { ok: true };
}

export type AddExpenseReportLineState = ExpenseReportLineFormState;

export async function addExpenseReportLineAction(
  _prevState: AddExpenseReportLineState,
  formData: FormData,
): Promise<AddExpenseReportLineState> {
  const values = rawLineFormValues(formData);

  const parsed = parseAddExpenseReportLineForm(formData);
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
    select: { id: true, assoId: true, status: true },
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
  if (!eligibility.ok) {
    return { ok: false, error: eligibility.error, values };
  }

  const amountCents = toAmountCents(parsed.data.amount);
  const warnings = await loadExpenseLineWarnings({
    assoId: structure.assoId,
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

  revalidatePath(`/app/${parsed.data.assoSlug}/notes-de-frais/${report.id}`);

  return { ok: true, warnings };
}

export type UpdateExpenseReportLineState = ExpenseReportLineFormState;

export async function updateExpenseReportLineAction(
  _prevState: UpdateExpenseReportLineState,
  formData: FormData,
): Promise<UpdateExpenseReportLineState> {
  const values = rawLineFormValues(formData);

  const parsed = parseUpdateExpenseReportLineForm(formData);
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
      expenseReport: { select: { assoId: true, status: true } },
    },
  });
  if (!line || line.expenseReport.assoId !== structure.assoId) {
    return { ok: false, error: "Ligne introuvable.", values };
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
  if (!eligibility.ok) {
    return { ok: false, error: eligibility.error, values };
  }

  const amountCents = toAmountCents(parsed.data.amount);
  const warnings = await loadExpenseLineWarnings({
    assoId: structure.assoId,
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

  revalidatePath(
    `/app/${parsed.data.assoSlug}/notes-de-frais/${line.expenseReportId}`,
  );

  return { ok: true, warnings };
}
