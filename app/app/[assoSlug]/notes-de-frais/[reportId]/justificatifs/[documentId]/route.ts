import { resolveStructureAccess } from "@/lib/auth/access";
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
 * Sert le contenu d'un Justificatif. Pas de `requireStructureAccess` ici :
 * ce garde-fou s'appuie sur `redirect`/`notFound` de `next/navigation`, pensés
 * pour le rendu de page — dans un Route Handler on renvoie directement des
 * codes HTTP explicites.
 */
export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ assoSlug: string; reportId: string; documentId: string }>;
  },
) {
  const { assoSlug, reportId, documentId } = await params;

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

  const document = await prisma.supportingDocument.findUnique({
    where: { id: documentId },
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
    document.expenseReportId !== reportId ||
    document.expenseReport.assoId !== access.assoId
  ) {
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
