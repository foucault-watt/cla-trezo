import type { FundingSourceType } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readStoredFile } from "@/lib/storage/file-storage";

function pdfFilename(pdf: {
  fundingSource: FundingSourceType;
  subvention: { reason: string } | null;
}): string {
  if (pdf.fundingSource === "CLUB_BALANCE") {
    return "note-de-frais-solde.pdf";
  }
  const slug = (pdf.subvention?.reason ?? "subvention")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `note-de-frais-${slug || "subvention"}.pdf`;
}

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
    },
  });

  if (!pdf || pdf.expenseReportId !== reportId) {
    return new Response(null, { status: 404 });
  }

  const content = await readStoredFile(pdf.filePath);

  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename(pdf)}"`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
