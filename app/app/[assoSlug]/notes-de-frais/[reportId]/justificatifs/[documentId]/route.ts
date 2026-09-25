import { prisma } from "@/lib/prisma";
import { structureFileRoute } from "@/lib/storage/stored-file-route";

/** Sert le contenu d'un Justificatif à sa Structure (accès, 410, en-têtes : cf. structureFileRoute). */
export const GET = structureFileRoute<{
  assoSlug: string;
  reportId: string;
  documentId: string;
}>(async ({ params, structure }) => {
  const document = await prisma.supportingDocument.findUnique({
    where: { id: params.documentId },
    select: {
      filePath: true,
      mimeType: true,
      originalFilename: true,
      expenseReportId: true,
      expenseReport: { select: { assoId: true } },
    },
  });

  if (
    !document ||
    document.expenseReportId !== params.reportId ||
    document.expenseReport.assoId !== structure.assoId
  ) {
    return null;
  }

  return {
    filePath: document.filePath,
    mimeType: document.mimeType,
    filename: document.originalFilename,
    disposition: "inline",
  };
});
