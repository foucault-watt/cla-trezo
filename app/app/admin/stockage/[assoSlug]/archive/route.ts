import { ZipArchive } from "archiver";
import { Readable } from "node:stream";
import {
  buildAssoArchiveEntries,
  getAssoArchiveSource,
  sanitizeArchiveSegment,
} from "@/lib/admin/storage";
import { getSession } from "@/lib/session";
import { readStoredFile } from "@/lib/storage/file-storage";

/**
 * Zip de tout l'historique (Justificatifs + PDF finaux) d'une Structure,
 * organisé par année puis par Note de frais — cf. buildAssoArchiveEntries.
 * L'archive est construite en streaming : on `pipe` avant de remplir pour
 * ne jamais bufferiser tout l'historique en mémoire d'un coup.
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

  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.on("error", (error: Error) => {
    archive.destroy(error);
  });

  void (async () => {
    try {
      for (const entry of entries) {
        try {
          const content = await readStoredFile(entry.filePath);
          archive.append(content, { name: entry.name });
        } catch (error) {
          // Un fichier référencé en base mais absent du disque ne doit pas
          // faire échouer tout le zip : les autres fichiers restent
          // téléchargeables (cf. /archive/check, qui prévient en amont).
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
          }
        }
      }
      await archive.finalize();
    } catch (error) {
      archive.destroy(error instanceof Error ? error : new Error(String(error)));
    }
  })();

  const filename = `${sanitizeArchiveSegment(asso.name)}-archive.zip`;

  return new Response(Readable.toWeb(archive) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}
