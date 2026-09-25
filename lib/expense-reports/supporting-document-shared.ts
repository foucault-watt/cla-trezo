import type { SupportingDocumentType } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
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

/**
 * Vit hors d'un fichier "use server" : une fonction non-async exportée
 * ferait échouer la contrainte Next.js "un fichier 'use server' ne peut
 * exporter que des fonctions async" (cf. expense-report-line-shared.ts).
 */
export function extractFiles(formData: FormData): File[] {
  return formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export type AddSupportingDocumentsState = { ok: boolean; error?: string };

/**
 * Cœur de l'ajout de Justificatifs, appelé par addExpenseReportDocuments
 * (expense-report-commands.ts) pour la Structure comme pour l'Admin, une fois
 * la Note chargée et vérifiée pour l'acteur. La règle d'exclusivité
 * (jamais Justificatif + Attestation sur la même Note, cf. issue #11 / T10),
 * les quotas et l'écriture des fichiers vivent ici.
 */
export async function addSupportingDocumentsCore({
  report,
  documentType,
  files,
}: {
  report: { id: string; assoSlug: string };
  documentType: SupportingDocumentType;
  files: File[];
}): Promise<AddSupportingDocumentsState> {
  const existingDocs = await prisma.supportingDocument.findMany({
    where: { expenseReportId: report.id },
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

  const writeResults = await Promise.allSettled(
    processedFiles.map((file) => {
      const relativePath = buildSupportingDocumentPath({
        assoSlug: report.assoSlug,
        reportId: report.id,
        extension: file.extension,
      });
      return writeStoredFile(relativePath, file.buffer).then(
        () => relativePath,
      );
    }),
  );
  const writtenPaths = writeResults
    .filter((result): result is PromiseFulfilledResult<string> =>
      result.status === "fulfilled",
    )
    .map((result) => result.value);
  const firstWriteFailure = writeResults.find(
    (result) => result.status === "rejected",
  );
  if (firstWriteFailure && firstWriteFailure.status === "rejected") {
    await Promise.allSettled(
      writtenPaths.map((relativePath) => deleteStoredFile(relativePath)),
    );
    throw firstWriteFailure.reason;
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (documentsToReplace.length > 0) {
        await tx.supportingDocument.deleteMany({
          where: { id: { in: documentsToReplace.map((d) => d.id) } },
        });
      }
      await tx.supportingDocument.createMany({
        data: processedFiles.map((file, index) => ({
          expenseReportId: report.id,
          type: documentType,
          filePath: writtenPaths[index],
          originalFilename: file.originalFilename,
          mimeType: file.mimeType,
        })),
      });
    });
  } catch (error) {
    await Promise.allSettled(
      writtenPaths.map((relativePath) => deleteStoredFile(relativePath)),
    );
    throw error;
  }

  // Nettoyage de l'ancien fichier d'Attestation remplacée : la DB et les
  // fichiers nouvellement écrits sont déjà cohérents à ce stade, donc un
  // échec ici (best-effort) ne doit surtout pas déclencher la suppression
  // des nouveaux fichiers désormais référencés en base.
  await Promise.allSettled(
    documentsToReplace.map((document) => deleteStoredFile(document.filePath)),
  );

  return { ok: true };
}

export type RemoveSupportingDocumentState = { ok: boolean; error?: string };

/**
 * Supprime un Justificatif en base et son fichier sur disque (cf.
 * removeExpenseReportDocument, expense-report-commands.ts).
 */
export async function removeSupportingDocumentCore(document: {
  id: string;
  filePath: string;
}): Promise<void> {
  await prisma.supportingDocument.delete({ where: { id: document.id } });
  await deleteStoredFile(document.filePath);
}
