import { buildExpenseReportPdfFilename } from "@/lib/expense-reports/expense-report-pdf-filename";
import { prisma } from "@/lib/prisma";
import { adminFileRoute } from "@/lib/storage/stored-file-route";

/**
 * Sert un PDF final (issue #20) à l'Admin, toutes Structures confondues. Un
 * fichier disparu du disque renvoie 410 (cf. adminFileRoute), sur lequel
 * pdf-download-button.tsx propose une reconstitution.
 */
export const GET = adminFileRoute<{ reportId: string; pdfId: string }>(
  async ({ params }) => {
    const pdf = await prisma.expenseReportPdf.findUnique({
      where: { id: params.pdfId },
      select: {
        filePath: true,
        expenseReportId: true,
        fundingSource: true,
        subvention: { select: { reason: true } },
        expenseReport: {
          select: {
            beneficiaryFirstname: true,
            beneficiaryLastname: true,
          },
        },
      },
    });

    if (!pdf || pdf.expenseReportId !== params.reportId) {
      return null;
    }

    return {
      filePath: pdf.filePath,
      mimeType: "application/pdf",
      filename: buildExpenseReportPdfFilename(pdf),
      disposition: "attachment",
    };
  },
);
