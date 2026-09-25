import type { StructureAccess } from "@/lib/auth/access";
import {
  resolveAdminRouteAccess,
  resolveStructureRouteAccess,
  type RouteAccess,
} from "@/lib/auth/route-access";
import type { SessionUser } from "@/lib/session";
import { readStoredFile } from "@/lib/storage/file-storage";

/**
 * Fichier stocké à servir, tel que décrit par le resolver d'une route.
 * `inline` pour ce que le navigateur affiche (Justificatif), `attachment`
 * pour ce qu'on télécharge (PDF final, Document d'octroi).
 */
export type StoredFile = {
  filePath: string;
  mimeType: string;
  filename: string;
  disposition: "inline" | "attachment";
};

type RouteContext<P> = { params: Promise<P> };

const GONE_MESSAGE =
  "Ce fichier n'est plus disponible. Contactez CLA pour le récupérer.";

/**
 * Route Handler `GET` servant un fichier stocké d'une Structure. Le resolver
 * ne fait que retrouver le fichier et vérifier qu'il appartient bien à la
 * Note / Structure de l'URL — `null` donne un 404. Tout le reste est commun à
 * toutes les routes de fichiers :
 * - accès (membre ou Admin, cookie démo pour l'Asso démo) : 401 / 404 ;
 * - fichier référencé en base mais absent du disque : 410 ;
 * - en-têtes (type MIME, nom de fichier RFC 6266, pas de cache partagé).
 */
export function structureFileRoute<P extends { assoSlug: string }>(
  resolve: (context: {
    params: P;
    structure: StructureAccess;
  }) => Promise<StoredFile | null>,
) {
  return async function GET(_request: Request, { params }: RouteContext<P>) {
    const resolvedParams = await params;
    return serve(
      await resolveStructureRouteAccess(resolvedParams.assoSlug),
      ({ structure }) => resolve({ params: resolvedParams, structure }),
    );
  };
}

/** Comme structureFileRoute, pour l'espace Admin (toutes Structures confondues). */
export function adminFileRoute<P>(
  resolve: (context: { params: P; user: SessionUser }) => Promise<StoredFile | null>,
) {
  return async function GET(_request: Request, { params }: RouteContext<P>) {
    const resolvedParams = await params;
    return serve(await resolveAdminRouteAccess(), ({ user }) =>
      resolve({ params: resolvedParams, user }),
    );
  };
}

async function serve<T>(
  access: RouteAccess<T>,
  resolve: (access: T) => Promise<StoredFile | null>,
): Promise<Response> {
  if (!access.ok) {
    return access.response;
  }

  const file = await resolve(access);
  if (!file) {
    return new Response(null, { status: 404 });
  }

  let content: Buffer;
  try {
    content = await readStoredFile(file.filePath);
  } catch (error) {
    // Référencé en base mais disparu du disque (ex : perte de stockage) —
    // distinct d'un id inconnu (404) : le bouton Admin propose alors une
    // reconstitution (cf. pdf-download-button.tsx), un lien direct affiche
    // le message.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new Response(GONE_MESSAGE, {
        status: 410,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    throw error;
  }

  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": contentDisposition(file),
      "Cache-Control": "private, max-age=0, no-cache",
    },
  });
}

/**
 * RFC 6266 : `filename` en ASCII pour les vieux clients, `filename*` en UTF-8
 * pour que les accents survivent dans le nom enregistré.
 */
function contentDisposition({ disposition, filename }: StoredFile): string {
  const asciiFallback = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]|["\\]/g, "_");
  const encoded = encodeURIComponent(filename).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
