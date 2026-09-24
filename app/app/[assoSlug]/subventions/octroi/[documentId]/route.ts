import { resolveStructureAccess } from "@/lib/auth/access";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readStoredFile } from "@/lib/storage/file-storage";
import { findGrantDocumentForAsso } from "@/lib/subventions/grant-documents";

async function lookupAssoBySlug(slug: string) {
  return prisma.asso.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
}

/**
 * Sert un Document d'octroi (ADR-0007) à sa Structure bénéficiaire — même
 * garde-fou explicite que la route des PDF finaux de Note de frais.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assoSlug: string; documentId: string }> },
) {
  const { assoSlug, documentId } = await params;

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

  const document = await findGrantDocumentForAsso(documentId, access.assoId);
  if (!document) {
    return new Response(null, { status: 404 });
  }

  const content = await readStoredFile(document.filePath);

  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${document.filename}"`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
