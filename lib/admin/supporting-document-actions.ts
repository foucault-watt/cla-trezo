"use server";

import type { SupportingDocumentType } from "@/app/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth/guards";
import {
  addExpenseReportDocuments,
  removeExpenseReportDocument,
} from "@/lib/expense-reports/expense-report-commands";
import {
  extractFiles,
  type AddSupportingDocumentsState,
  type RemoveSupportingDocumentState,
} from "@/lib/expense-reports/supporting-document-shared";
import {
  parseAddSupportingDocumentsAsAdminForm,
  parseRemoveSupportingDocumentAsAdminForm,
} from "./supporting-document-input";

/**
 * Adapter Admin de addExpenseReportDocuments (expense-report-commands.ts) :
 * même règle que côté Structure, l'Admin ne modifiant qu'une Note Prise en
 * charge (ADR-0001).
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

  await requireAdmin();
  return addExpenseReportDocuments(
    { type: "ADMIN" },
    {
      expenseReportId: parsed.data.expenseReportId,
      documentType: parsed.data.documentType as SupportingDocumentType,
      files: extractFiles(formData),
    },
  );
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
  return removeExpenseReportDocument({ type: "ADMIN" }, parsed.data);
}
