import { buildExpenseReportPdfFilename } from "@/lib/expense-reports/expense-report-pdf-filename";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readStoredFile } from "@/lib/storage/file-storage";

const GONE = 410;

/**
 * Sert le contenu d'un PDF final (issue #20), pour l'Admin, toutes
 * Structures confondues — même garde-fou explicite (pas de `requireAdmin`,
 * pensé pour le rendu de page) que la route équivalente pour un Justificatif
 * (cf. justificatifs/[documentId]/route.ts).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportId: string; pdfId: string }> },
) {
  const session = await getSession();
  if (!session.user) {
    return new Response(null, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return new Response(null, { status: 404 });
  }

  const { reportId, pdfId } = await params;

  const pdf = await prisma.expenseReportPdf.findUnique({
    where: { id: pdfId },
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

  if (!pdf || pdf.expenseReportId !== reportId) {
    return new Response(null, { status: 404 });
  }

  let content: Buffer;
  try {
    content = await readStoredFile(pdf.filePath);
  } catch (error) {
    // Le PDF est bien référencé en base mais son fichier a disparu du disque
    // (ex : perte de stockage) — distinct d'un pdfId inconnu (404), pour que
    // le client propose une reconstitution plutôt qu'une erreur générique.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Response(null, { status: GONE });
    }
    throw error;
  }

  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${buildExpenseReportPdfFilename(pdf)}"`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
