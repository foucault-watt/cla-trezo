import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readStoredFile } from "@/lib/storage/file-storage";

/**
 * Sert le contenu d'un Justificatif pour l'Admin, toutes Structures
 * confondues. Pas de `requireAdmin` ici : ce garde-fou s'appuie sur
 * `redirect`/`notFound` de `next/navigation`, pensés pour le rendu de page —
 * dans un Route Handler on renvoie directement des codes HTTP explicites
 * (cf. la route équivalente côté Structure).
 */
export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ reportId: string; documentId: string }> },
) {
  const session = await getSession();
  if (!session.user) {
    return new Response(null, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return new Response(null, { status: 404 });
  }

  const { reportId, documentId } = await params;

  const document = await prisma.supportingDocument.findUnique({
    where: { id: documentId },
    select: {
      filePath: true,
      mimeType: true,
      originalFilename: true,
      expenseReportId: true,
    },
  });

  if (!document || document.expenseReportId !== reportId) {
    return new Response(null, { status: 404 });
  }

  const content = await readStoredFile(document.filePath);

  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        document.originalFilename,
      )}"`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
