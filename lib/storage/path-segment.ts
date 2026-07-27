/**
 * Défense en profondeur pour la construction de chemins de fichiers à partir
 * de `assoSlug`/`reportId` : même s'ils sont déjà vérifiés en amont (Structure
 * existante, uuid validé par zod), on refuse ici tout segment qui pourrait
 * sortir de l'arborescence de stockage (`..`, `/`, `\`).
 */
const SAFE_SEGMENT_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function isSafePathSegment(segment: string): boolean {
  return SAFE_SEGMENT_PATTERN.test(segment);
}

export function assertSafePathSegment(segment: string, label: string): void {
  if (!isSafePathSegment(segment)) {
    throw new Error(`Segment de chemin invalide pour ${label} : "${segment}".`);
  }
}
