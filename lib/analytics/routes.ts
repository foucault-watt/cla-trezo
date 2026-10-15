import { DEMO_ASSO_SLUG } from "@/lib/auth/demo-config";

/*
 * Règles pures sur les chemins suivis par les pages vues (cf.
 * app/api/analytics/page-view/route.ts). Pas de dépendance à Prisma : le
 * composant client et le Route Handler partagent ces règles.
 */

const UUID_SEGMENT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Segments sous /app qui ne sont pas un slug d'Asso. */
const NON_ASSO_SEGMENTS = new Set(["admin"]);

export const MAX_TRACKED_PATH_LENGTH = 300;

function pathSegments(path: string): string[] {
  const withoutQuery = path.split(/[?#]/)[0];
  return withoutQuery.split("/").filter(Boolean);
}

/**
 * Seules les pages de l'app connectée sont suivies, jamais la landing, le
 * login ni l'Asso démo (session jetable, cf. lib/auth/demo.ts).
 */
export function isTrackablePath(path: string): boolean {
  if (!path.startsWith("/") || path.length > MAX_TRACKED_PATH_LENGTH) {
    return false;
  }
  const segments = pathSegments(path);
  return segments[0] === "app" && segments[1] !== DEMO_ASSO_SLUG;
}

/** Slug d'Asso d'un chemin /app/[assoSlug]/..., null sinon. */
export function extractAssoSlug(path: string): string | null {
  const segments = pathSegments(path);
  if (segments[0] !== "app" || !segments[1]) return null;
  return NON_ASSO_SEGMENTS.has(segments[1]) ? null : segments[1];
}

/**
 * Chemin sans requête, où le slug d'Asso devient `[asso]` et chaque
 * identifiant `[id]` : regroupe les pages de même nature
 * (/app/[asso]/notes-de-frais/[id]) quelle que soit l'Asso ou la Note.
 */
export function normalizeRoute(path: string): string {
  const segments = pathSegments(path).map((segment, index) => {
    if (index === 1 && extractAssoSlug(path) !== null) return "[asso]";
    return UUID_SEGMENT.test(segment) ? "[id]" : segment;
  });
  return `/${segments.join("/")}`;
}

/** Chemin stocké : sans requête ni fragment, qui peuvent porter un message. */
export function cleanPath(path: string): string {
  return `/${pathSegments(path).join("/")}`;
}

export type DeviceKind = "mobile" | "tablet" | "desktop";

/** Type d'appareil à partir de `userAgent(request).device.type` (Next). */
export function deviceKind(deviceType: string | undefined): DeviceKind {
  if (deviceType === "mobile" || deviceType === "wearable") return "mobile";
  if (deviceType === "tablet") return "tablet";
  return "desktop";
}
