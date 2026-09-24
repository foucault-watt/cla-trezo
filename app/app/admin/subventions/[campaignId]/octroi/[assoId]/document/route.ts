import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { readStoredFile } from "@/lib/storage/file-storage";
import { buildGrantDocumentFilename } from "@/lib/subventions/grant-documents";

/**
 * Sert le Document d'octroi stocké d'une Structure pour une Campagne, pour
 * l'Admin — même garde-fou explicite que la route Admin des PDF finaux de
 * Note de frais.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ campaignId: string; assoId: string }> },
) {
  const session = await getSession();
  if (!session.user) {
    return new Response(null, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return new Response(null, { status: 404 });
  }

  const { campaignId, assoId } = await params;
  const document = await prisma.grantDocument.findUnique({
    where: { campaignId_assoId: { campaignId, assoId } },
    select: {
      kind: true,
      filePath: true,
      asso: { select: { name: true } },
      campaign: { select: { name: true } },
    },
  });
  if (!document) {
    return new Response(null, { status: 404 });
  }

  const content = await readStoredFile(document.filePath);
  const filename = buildGrantDocumentFilename({
    kind: document.kind,
    campaignName: document.campaign.name,
    assoName: document.asso.name,
  });

  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
