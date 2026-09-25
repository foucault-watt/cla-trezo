import { buildExpenseReportPdfFilename } from "@/lib/expense-reports/expense-report-pdf-filename";
import { prisma } from "@/lib/prisma";
import { structureFileRoute } from "@/lib/storage/stored-file-route";

/** Sert un PDF final (issue #20) à la Structure de la Note de frais (cf. structureFileRoute). */
export const GET = structureFileRoute<{
  assoSlug: string;
  reportId: string;
  pdfId: string;
}>(async ({ params, structure }) => {
  const pdf = await prisma.expenseReportPdf.findUnique({
    where: { id: params.pdfId },
    select: {
      filePath: true,
      expenseReportId: true,
      fundingSource: true,
      subvention: { select: { reason: true } },
      expenseReport: {
        select: {
          assoId: true,
          beneficiaryFirstname: true,
          beneficiaryLastname: true,
        },
      },
    },
  });

  if (
    !pdf ||
    pdf.expenseReportId !== params.reportId ||
    pdf.expenseReport.assoId !== structure.assoId
  ) {
    return null;
  }

  return {
    filePath: pdf.filePath,
    mimeType: "application/pdf",
    filename: buildExpenseReportPdfFilename(pdf),
    disposition: "attachment",
  };
});
