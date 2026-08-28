import {
  buildAssoArchiveEntries,
  getAssoArchiveSource,
  type ArchiveCheckResult,
} from "@/lib/admin/storage";
import { getSession } from "@/lib/session";
import { storedFileExists } from "@/lib/storage/file-storage";

/**
 * Compte, sans rien télécharger, combien des fichiers attendus pour cette
 * Structure sont réellement présents sur le disque — sert à prévenir avant
 * le zip plutôt que de le découvrir en cours de téléchargement (cf.
 * StorageArchiveButton).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assoSlug: string }> },
) {
  const session = await getSession();
  if (!session.user) {
    return new Response(null, { status: 401 });
  }
  if (!session.user.isAdmin) {
    return new Response(null, { status: 404 });
  }

  const { assoSlug } = await params;

  const asso = await getAssoArchiveSource(assoSlug);
  if (!asso) {
    return new Response(null, { status: 404 });
  }

  const entries = buildAssoArchiveEntries(asso);
  const availability = await Promise.all(
    entries.map((entry) => storedFileExists(entry.filePath)),
  );
  const availableCount = availability.filter(Boolean).length;

  const result: ArchiveCheckResult = {
    totalCount: entries.length,
    availableCount,
    missingCount: entries.length - availableCount,
  };

  return Response.json(result);
}
