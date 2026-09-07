import { resolveStructureAccess } from "@/lib/auth/access";
import { buildExpenseReportPdfFilename } from "@/lib/expense-reports/expense-report-pdf-filename";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readStoredFile } from "@/lib/storage/file-storage";

async function lookupAssoBySlug(slug: string) {
  return prisma.asso.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
}

/**
 * Sert le contenu d'un PDF final (issue #20) à la Structure bénéficiaire de
 * la Note de frais Validée — même garde-fou explicite (pas de
 * `requireStructureAccess`, pensé pour le rendu de page) que la route
 * équivalente pour un Justificatif (cf. justificatifs/[documentId]/route.ts).
 */
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ assoSlug: string; reportId: string; pdfId: string }>;
  },
) {
  const { assoSlug, reportId, pdfId } = await params;

  const session = await getSession();
  const access = await resolveStructureAccess(
    session.user,
    assoSlug,
    lookupAssoBySlug,
  );
  if (!access.ok) {
    return new Response(null, {
      status: access.reason === "unauthenticated" ? 401 : 404,
    });
  }

  const pdf = await prisma.expenseReportPdf.findUnique({
    where: { id: pdfId },
    select: {
      filePath: true,
      expenseReportId: true,
      fundingSource: true,
      subvention: { select: { reason: true } },
      expenseReport: { select: { assoId: true } },
    },
  });

  if (
    !pdf ||
    pdf.expenseReportId !== reportId ||
    pdf.expenseReport.assoId !== access.assoId
  ) {
    return new Response(null, { status: 404 });
  }

  const content = await readStoredFile(pdf.filePath);

  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${buildExpenseReportPdfFilename(pdf)}"`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
