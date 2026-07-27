"use server";

import { revalidatePath } from "next/cache";
import type { FundingSourceType } from "@/app/generated/prisma/enums";
import { requireStructureAccess } from "@/lib/auth/guards";
import { toAmountCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { isEditableExpenseReportStatus } from "./expense-report-status";
import {
  parseAddExpenseReportLineForm,
  parseCreateExpenseReportForm,
  parseSubmitExpenseReportForm,
  parseUpdateExpenseReportForm,
  parseUpdateExpenseReportLineForm,
} from "./expense-report-input";

/**
 * Vérifie la règle T11 : Solde réservé aux Clubs, Subvention réservée à une
 * Structure destinataire dont la Campagne est Publiée. Partagée par l'ajout
 * et la modification de Ligne, seuls points d'entrée où une source de
 * financement est choisie.
 */
async function checkFundingSourceEligibility({
  assoId,
  fundingSource,
  subventionId,
}: {
  assoId: string;
  fundingSource: FundingSourceType;
  subventionId: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (fundingSource === "CLUB_BALANCE") {
    const asso = await prisma.asso.findUnique({
      where: { id: assoId },
      select: { type: true },
    });
    if (asso?.type !== "CLUB") {
      return { ok: false, error: "Seuls les Clubs peuvent utiliser le Solde." };
    }
    return { ok: true };
  }

  const subvention = await prisma.subvention.findUnique({
    where: { id: subventionId as string },
    select: { assoId: true, campaign: { select: { publicationDate: true } } },
  });
  const now = new Date();
  if (
    !subvention ||
    subvention.assoId !== assoId ||
    !subvention.campaign.publicationDate ||
    subvention.campaign.publicationDate > now
  ) {
    return { ok: false, error: "Subvention introuvable ou non publiée." };
  }
  return { ok: true };
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
  if (!isEditableExpenseReportStatus(report.status)) {
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
  if (report.status !== "DRAFT") {
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

export type ExpenseReportLineFormValues = {
  beneficiaryFirstname: string;
  beneficiaryLastname: string;
  iban: string;
  amount: string;
  expenseName: string;
  typeDepenseId: string;
  customLabel: string;
  fundingSource: string;
  subventionId: string;
};

/**
 * Valeurs brutes (non validées) resaisies telles quelles en cas d'échec, pour
 * que le formulaire puisse les réafficher au lieu de forcer une resaisie
 * complète après une erreur de validation.
 */
function rawLineFormValues(formData: FormData): ExpenseReportLineFormValues {
  return {
    beneficiaryFirstname: String(formData.get("beneficiaryFirstname") ?? ""),
    beneficiaryLastname: String(formData.get("beneficiaryLastname") ?? ""),
    iban: String(formData.get("iban") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    expenseName: String(formData.get("expenseName") ?? ""),
    typeDepenseId: String(formData.get("typeDepenseId") ?? ""),
    customLabel: String(formData.get("customLabel") ?? ""),
    fundingSource: String(formData.get("fundingSource") ?? ""),
    subventionId: String(formData.get("subventionId") ?? ""),
  };
}

export type AddExpenseReportLineState = {
  ok: boolean;
  error?: string;
  values?: ExpenseReportLineFormValues;
};

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
  if (!isEditableExpenseReportStatus(report.status)) {
    return {
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
      values,
    };
  }

  const eligibility = await checkFundingSourceEligibility({
    assoId: structure.assoId,
    fundingSource: parsed.data.fundingSource,
    subventionId: parsed.data.subventionId,
  });
  if (!eligibility.ok) {
    return { ok: false, error: eligibility.error, values };
  }

  await prisma.expenseReportLine.create({
    data: {
      expenseReportId: report.id,
      beneficiaryFirstname: parsed.data.beneficiaryFirstname,
      beneficiaryLastname: parsed.data.beneficiaryLastname,
      iban: parsed.data.iban,
      amountCents: toAmountCents(parsed.data.amount),
      expenseName: parsed.data.expenseName,
      typeDepenseId: parsed.data.typeDepenseId,
      customLabel: parsed.data.customLabel,
      fundingSource: parsed.data.fundingSource,
      subventionId: parsed.data.subventionId,
    },
  });

  revalidatePath(`/app/${parsed.data.assoSlug}/notes-de-frais/${report.id}`);

  return { ok: true };
}

export type UpdateExpenseReportLineState = {
  ok: boolean;
  error?: string;
  values?: ExpenseReportLineFormValues;
};

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
  if (!isEditableExpenseReportStatus(line.expenseReport.status)) {
    return {
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
      values,
    };
  }

  const eligibility = await checkFundingSourceEligibility({
    assoId: structure.assoId,
    fundingSource: parsed.data.fundingSource,
    subventionId: parsed.data.subventionId,
  });
  if (!eligibility.ok) {
    return { ok: false, error: eligibility.error, values };
  }

  await prisma.expenseReportLine.update({
    where: { id: line.id },
    data: {
      beneficiaryFirstname: parsed.data.beneficiaryFirstname,
      beneficiaryLastname: parsed.data.beneficiaryLastname,
      iban: parsed.data.iban,
      amountCents: toAmountCents(parsed.data.amount),
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

  return { ok: true };
}
