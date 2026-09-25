"use server";

import type { SupportingDocumentType } from "@/app/generated/prisma/enums";
import { requireStructureMember } from "@/lib/auth/guards";
import {
  addExpenseReportDocuments,
  removeExpenseReportDocument,
} from "./expense-report-commands";
import {
  extractFiles,
  type AddSupportingDocumentsState,
  type RemoveSupportingDocumentState,
} from "./supporting-document-shared";
import {
  parseAddSupportingDocumentsForm,
  parseRemoveSupportingDocumentForm,
} from "./supporting-document-input";

/**
 * Ajoute un ou plusieurs Justificatifs, ou remplace l'Attestation sur
 * l'honneur existante — adapter Structure de addExpenseReportDocuments
 * (expense-report-commands.ts), partagé avec l'Admin.
 */
export async function addSupportingDocumentsAction(
  _prevState: AddSupportingDocumentsState,
  formData: FormData,
): Promise<AddSupportingDocumentsState> {
  const parsed = parseAddSupportingDocumentsForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const { structure } = await requireStructureMember(parsed.data.assoSlug);
  return addExpenseReportDocuments(
    { type: "STRUCTURE", assoId: structure.assoId },
    {
      expenseReportId: parsed.data.expenseReportId,
      documentType: parsed.data.documentType as SupportingDocumentType,
      files: extractFiles(formData),
    },
  );
}

export async function removeSupportingDocumentAction(
  _prevState: RemoveSupportingDocumentState,
  formData: FormData,
): Promise<RemoveSupportingDocumentState> {
  const parsed = parseRemoveSupportingDocumentForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const { structure } = await requireStructureMember(parsed.data.assoSlug);
  return removeExpenseReportDocument(
    { type: "STRUCTURE", assoId: structure.assoId },
    parsed.data,
  );
}
