"use server";

import { revalidatePath } from "next/cache";
import type { SupportingDocumentType } from "@/app/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  assertExpenseReportMutable,
  ExpenseReportLifecycleError,
} from "@/lib/expense-reports/expense-report-lifecycle";
import {
  addSupportingDocumentsCore,
  extractFiles,
  removeSupportingDocumentCore,
  type AddSupportingDocumentsState,
  type RemoveSupportingDocumentState,
} from "@/lib/expense-reports/supporting-document-shared";
import {
  parseAddSupportingDocumentsAsAdminForm,
  parseRemoveSupportingDocumentAsAdminForm,
} from "./supporting-document-input";

type EditableReportCheck =
  | { ok: true; report: { id: string; assoSlug: string } }
  | { ok: false; error: string };

async function loadEditableReport(reportId: string): Promise<EditableReportCheck> {
  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, asso: { select: { slug: true } } },
  });
  if (!report) {
    return { ok: false, error: "Note de frais introuvable." };
  }
  try {
    assertExpenseReportMutable({
      status: report.status,
      actor: { type: "ADMIN" },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return { ok: false, error: "Cette Note de frais n'est plus modifiable." };
  }
  return { ok: true, report: { id: report.id, assoSlug: report.asso.slug } };
}

/**
 * Équivalent Admin de addSupportingDocumentsAction
 * (lib/expense-reports/supporting-document-actions.ts) : auth et chargement
 * de la Note propres à l'Admin (pas de scoping par assoSlug, l'Admin n'est
 * rattaché à aucune Structure), logique métier partagée via
 * addSupportingDocumentsCore.
 */
export async function addSupportingDocumentsAsAdminAction(
  _prevState: AddSupportingDocumentsState,
  formData: FormData,
): Promise<AddSupportingDocumentsState> {
  const parsed = parseAddSupportingDocumentsAsAdminForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const files = extractFiles(formData);
  const documentType = parsed.data.documentType as SupportingDocumentType;

  await requireAdmin();

  const reportCheck = await loadEditableReport(parsed.data.expenseReportId);
  if (!reportCheck.ok) {
    return { ok: false, error: reportCheck.error };
  }

  const result = await addSupportingDocumentsCore({
    report: reportCheck.report,
    documentType,
    files,
  });

  if (result.ok) {
    revalidatePath(`/app/admin/notes-de-frais/${reportCheck.report.id}`);
  }

  return result;
}

export async function removeSupportingDocumentAsAdminAction(
  _prevState: RemoveSupportingDocumentState,
  formData: FormData,
): Promise<RemoveSupportingDocumentState> {
  const parsed = parseRemoveSupportingDocumentAsAdminForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  await requireAdmin();

  const document = await prisma.supportingDocument.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      filePath: true,
      expenseReportId: true,
      expenseReport: { select: { status: true } },
    },
  });
  if (!document) {
    return { ok: false, error: "Justificatif introuvable." };
  }
  try {
    assertExpenseReportMutable({
      status: document.expenseReport.status,
      actor: { type: "ADMIN" },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return { ok: false, error: "Cette Note de frais n'est plus modifiable." };
  }

  await removeSupportingDocumentCore(document);

  revalidatePath(`/app/admin/notes-de-frais/${document.expenseReportId}`);

  return { ok: true };
}
