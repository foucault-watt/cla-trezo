"use server";

import { revalidatePath } from "next/cache";
import type { SupportingDocumentType } from "@/app/generated/prisma/enums";
import { requireStructureAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  assertExpenseReportMutable,
  ExpenseReportLifecycleError,
} from "./expense-report-lifecycle";
import {
  buildSupportingDocumentPath,
  deleteStoredFile,
  writeStoredFile,
} from "@/lib/storage/file-storage";
import {
  compressImageIfNeeded,
  type ProcessedFile,
} from "@/lib/storage/image-processing";
import {
  MAX_HONOR_STATEMENT_FILES_PER_REPORT,
  MAX_RECEIPT_FILES_PER_REPORT,
} from "@/lib/storage/constants";
import {
  validateFileContent,
  validateFileCount,
  validateFileSize,
} from "@/lib/storage/validate-upload";
import {
  parseAddSupportingDocumentsForm,
  parseRemoveSupportingDocumentForm,
} from "./supporting-document-input";

function extractFiles(formData: FormData): File[] {
  return formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

type EditableReportCheck =
  { ok: true; report: { id: string } } | { ok: false; error: string };

async function loadEditableReport(
  reportId: string,
  assoId: string,
): Promise<EditableReportCheck> {
  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
    select: { id: true, assoId: true, status: true },
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
  return { ok: true, report: { id: report.id } };
}

export type AddSupportingDocumentsState = { ok: boolean; error?: string };

/**
 * Ajoute un ou plusieurs Justificatifs, ou remplace l'Attestation sur
 * l'honneur existante (limitée à un seul fichier). La règle d'exclusivité
 * (jamais Justificatif + Attestation sur la même Note) est vérifiée ici,
 * pas seulement côté UI — cf. issue #11 (T10).
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

  const { structure } = await requireStructureAccess(parsed.data.assoSlug);

  const reportCheck = await loadEditableReport(
    parsed.data.expenseReportId,
    structure.assoId,
  );
  if (!reportCheck.ok) {
    return { ok: false, error: reportCheck.error };
  }

  const existingDocs = await prisma.supportingDocument.findMany({
    where: { expenseReportId: reportCheck.report.id },
    select: { id: true, type: true, filePath: true },
  });
  const existingReceipts = existingDocs.filter((d) => d.type === "RECEIPT");
  const existingHonorStatements = existingDocs.filter(
    (d) => d.type === "HONOR_STATEMENT",
  );

  if (documentType === "RECEIPT" && existingHonorStatements.length > 0) {
    return {
      ok: false,
      error:
        "Impossible d'ajouter un Justificatif : une Attestation sur l'honneur est déjà présente sur cette Note. Supprimez-la d'abord.",
    };
  }
  if (documentType === "HONOR_STATEMENT" && existingReceipts.length > 0) {
    return {
      ok: false,
      error:
        "Impossible d'ajouter une Attestation sur l'honneur : des Justificatifs sont déjà présents sur cette Note. Supprimez-les d'abord.",
    };
  }

  const maxCount =
    documentType === "RECEIPT"
      ? MAX_RECEIPT_FILES_PER_REPORT
      : MAX_HONOR_STATEMENT_FILES_PER_REPORT;
  // L'Attestation existante est remplacée (pas cumulée), donc elle ne compte
  // pas dans le total déjà présent.
  const existingCountForType =
    documentType === "RECEIPT" ? existingReceipts.length : 0;

  const countCheck = validateFileCount({
    existingCount: existingCountForType,
    incomingCount: files.length,
    maxCount,
  });
  if (!countCheck.ok) {
    return { ok: false, error: countCheck.error };
  }

  const processedFiles: (ProcessedFile & { originalFilename: string })[] = [];
  for (const file of files) {
    const sizeCheck = validateFileSize(file.size);
    if (!sizeCheck.ok) {
      return { ok: false, error: `"${file.name}" : ${sizeCheck.error}` };
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const contentCheck = validateFileContent(rawBuffer);
    if (!contentCheck.ok) {
      return { ok: false, error: `"${file.name}" : ${contentCheck.error}` };
    }

    const finalFile = await compressImageIfNeeded(
      rawBuffer,
      contentCheck.mimeType,
    );
    processedFiles.push({ ...finalFile, originalFilename: file.name });
  }

  const documentsToReplace =
    documentType === "HONOR_STATEMENT" ? existingHonorStatements : [];

  const writtenPaths: string[] = [];
  try {
    for (const file of processedFiles) {
      const relativePath = buildSupportingDocumentPath({
        assoSlug: structure.slug,
        reportId: reportCheck.report.id,
        extension: file.extension,
      });
      await writeStoredFile(relativePath, file.buffer);
      writtenPaths.push(relativePath);
    }

    await prisma.$transaction(async (tx) => {
      if (documentsToReplace.length > 0) {
        await tx.supportingDocument.deleteMany({
          where: { id: { in: documentsToReplace.map((d) => d.id) } },
        });
      }
      await tx.supportingDocument.createMany({
        data: processedFiles.map((file, index) => ({
          expenseReportId: reportCheck.report.id,
          type: documentType,
          filePath: writtenPaths[index],
          originalFilename: file.originalFilename,
          mimeType: file.mimeType,
        })),
      });
    });
  } catch (error) {
    for (const relativePath of writtenPaths) {
      await deleteStoredFile(relativePath);
    }
    throw error;
  }

  // Nettoyage de l'ancien fichier d'Attestation remplacée : la DB et les
  // fichiers nouvellement écrits sont déjà cohérents à ce stade, donc un
  // échec ici (best-effort) ne doit surtout pas déclencher la suppression
  // des nouveaux fichiers désormais référencés en base.
  for (const document of documentsToReplace) {
    try {
      await deleteStoredFile(document.filePath);
    } catch {
      // Fichier orphelin toléré : pas de purge automatique en V1 de toute façon.
    }
  }

  revalidatePath(
    `/app/${parsed.data.assoSlug}/notes-de-frais/${reportCheck.report.id}`,
  );

  return { ok: true };
}

export type RemoveSupportingDocumentState = { ok: boolean; error?: string };

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

  const { structure } = await requireStructureAccess(parsed.data.assoSlug);

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

  await prisma.supportingDocument.delete({ where: { id: document.id } });
  await deleteStoredFile(document.filePath);

  revalidatePath(
    `/app/${parsed.data.assoSlug}/notes-de-frais/${document.expenseReportId}`,
  );

  return { ok: true };
}
