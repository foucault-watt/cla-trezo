"use server";

import { revalidatePath } from "next/cache";
import type { SupportingDocumentType } from "@/app/generated/prisma/enums";
import { requireStructureMember } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  assertExpenseReportMutable,
  ExpenseReportLifecycleError,
} from "./expense-report-lifecycle";
import {
  addSupportingDocumentsCore,
  extractFiles,
  removeSupportingDocumentCore,
  type AddSupportingDocumentsState,
  type RemoveSupportingDocumentState,
} from "./supporting-document-shared";
import {
  parseAddSupportingDocumentsForm,
  parseRemoveSupportingDocumentForm,
} from "./supporting-document-input";

type EditableReportCheck =
  | { ok: true; report: { id: string; assoSlug: string } }
  | { ok: false; error: string };

async function loadEditableReport(
  reportId: string,
  assoId: string,
): Promise<EditableReportCheck> {
  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      assoId: true,
      status: true,
      asso: { select: { slug: true } },
    },
  });
  if (!report || report.assoId !== assoId) {
    return { ok: false, error: "Note de frais introuvable." };
  }
  try {
    assertExpenseReportMutable({
      status: report.status,
      actor: { type: "STRUCTURE", assoId },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return { ok: false, error: "Cette Note de frais n'est plus modifiable." };
  }
  return { ok: true, report: { id: report.id, assoSlug: report.asso.slug } };
}

/**
 * Ajoute un ou plusieurs Justificatifs, ou remplace l'Attestation sur
 * l'honneur existante (limitée à un seul fichier). Auth et chargement de la
 * Note propres à la Structure ; la logique métier vit dans
 * addSupportingDocumentsCore (supporting-document-shared.ts), partagée avec
 * l'Admin.
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

  const files = extractFiles(formData);
  const documentType = parsed.data.documentType as SupportingDocumentType;

  const { structure } = await requireStructureMember(parsed.data.assoSlug);

  const reportCheck = await loadEditableReport(
    parsed.data.expenseReportId,
    structure.assoId,
  );
  if (!reportCheck.ok) {
    return { ok: false, error: reportCheck.error };
  }

  const result = await addSupportingDocumentsCore({
    report: reportCheck.report,
    documentType,
    files,
  });

  if (result.ok) {
    revalidatePath(
      `/app/${parsed.data.assoSlug}/notes-de-frais/${reportCheck.report.id}`,
    );
  }

  return result;
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

  const document = await prisma.supportingDocument.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      filePath: true,
      expenseReportId: true,
      expenseReport: { select: { assoId: true, status: true } },
    },
  });
  if (!document || document.expenseReport.assoId !== structure.assoId) {
    return { ok: false, error: "Justificatif introuvable." };
  }
  try {
    assertExpenseReportMutable({
      status: document.expenseReport.status,
      actor: { type: "STRUCTURE", assoId: structure.assoId },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return { ok: false, error: "Cette Note de frais n'est plus modifiable." };
  }

  await removeSupportingDocumentCore(document);

  revalidatePath(
    `/app/${parsed.data.assoSlug}/notes-de-frais/${document.expenseReportId}`,
  );

  return { ok: true };
}
