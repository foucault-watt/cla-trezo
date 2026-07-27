import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertSafePathSegment } from "./path-segment";

function resolveStorageRoot(): string {
  const configured = process.env.STORAGE_ROOT_DIR ?? "./uploads";
  return path.resolve(process.cwd(), configured);
}

/**
 * Chemin relatif stocké en base (`SupportingDocument.filePath`) : indépendant
 * de la racine de stockage pour pouvoir déplacer celle-ci sans migration.
 */
export function buildSupportingDocumentPath({
  assoSlug,
  reportId,
  extension,
}: {
  assoSlug: string;
  reportId: string;
  extension: string;
}): string {
  assertSafePathSegment(assoSlug, "assoSlug");
  assertSafePathSegment(reportId, "reportId");
  assertSafePathSegment(extension, "extension");

  const filename = `${randomUUID()}.${extension}`;
  return path.posix.join(assoSlug, reportId, filename);
}

function resolveAbsolutePath(relativePath: string): string {
  const root = resolveStorageRoot();
  const absolute = path.resolve(root, relativePath);
  if (!absolute.startsWith(root + path.sep) && absolute !== root) {
    throw new Error(
      `Chemin de fichier hors de la racine de stockage : "${relativePath}".`,
    );
  }
  return absolute;
}

export async function writeStoredFile(
  relativePath: string,
  data: Buffer,
): Promise<void> {
  const absolute = resolveAbsolutePath(relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, data);
}

export async function readStoredFile(relativePath: string): Promise<Buffer> {
  return readFile(resolveAbsolutePath(relativePath));
}

export async function deleteStoredFile(relativePath: string): Promise<void> {
  try {
    await unlink(resolveAbsolutePath(relativePath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
