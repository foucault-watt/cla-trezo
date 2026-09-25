/**
 * Âge d'une Subvention, toujours mesuré depuis la date de PUBLICATION de sa
 * Campagne (jamais la date de la Campagne elle-même, cf. CONTEXT.md
 * "Subvention ancienne"). Seule source de vérité pour :
 * - le Warning "Subvention ancienne" sur un Remboursement (T15) ;
 * - le panneau de sélection d'une Subvention dans une Note de frais ;
 * - les bandes d'âge des pages Subventions (Structure et Admin) ;
 * - les chiffres "12 derniers mois" du Dashboard.
 *
 * - "recent" : publiée il y a un an ou moins ;
 * - "old" : plus d'un an, jusqu'à deux ans — encore sélectionnable pour un
 *   Remboursement, mais flaguée par le Warning ;
 * - "history" : plus de deux ans — hors fenêtre de financement, n'apparaît
 *   plus dans le panneau de sélection.
 */
export type SubventionAgeBand = "recent" | "old" | "history";

function yearsBefore(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() - years);
  return result;
}

export function getSubventionAgeBand(
  publicationDate: Date,
  now: Date = new Date(),
): SubventionAgeBand {
  if (publicationDate >= yearsBefore(now, 1)) return "recent";
  if (publicationDate >= yearsBefore(now, 2)) return "old";
  return "history";
}

/**
 * Warning T15. Une Campagne Programmée (sans date de publication) n'est
 * jamais ancienne.
 */
export function isSubventionStale(
  publicationDate: Date | null,
  now: Date = new Date(),
): boolean {
  return (
    publicationDate !== null &&
    getSubventionAgeBand(publicationDate, now) !== "recent"
  );
}

export function isSubventionWithinFundingWindow(
  publicationDate: Date,
  now: Date = new Date(),
): boolean {
  return getSubventionAgeBand(publicationDate, now) !== "history";
}
