import { prisma } from "@/lib/prisma";
import { adminFileRoute } from "@/lib/storage/stored-file-route";

/** Sert le contenu d'un Justificatif à l'Admin, toutes Structures confondues (cf. adminFileRoute). */
export const GET = adminFileRoute<{ reportId: string; documentId: string }>(
  async ({ params }) => {
    const document = await prisma.supportingDocument.findUnique({
      where: { id: params.documentId },
      select: {
        filePath: true,
        mimeType: true,
        originalFilename: true,
        expenseReportId: true,
      },
    });

    if (!document || document.expenseReportId !== params.reportId) {
      return null;
    }

    return {
      filePath: document.filePath,
      mimeType: document.mimeType,
      filename: document.originalFilename,
      disposition: "inline",
    };
  },
);
