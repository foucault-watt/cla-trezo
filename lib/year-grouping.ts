const RECENT_YEARS_WINDOW = 2;

/**
 * Sépare une liste d'éléments datés entre "récents" (année en cours + année
 * précédente) et "historique" (tout le reste). Générique sur `T` via un
 * accesseur de date plutôt qu'un nom de champ fixe, pour être réutilisé par
 * toute liste groupée par année (Notes de frais Structure/Admin, Campagnes
 * de subvention…) sans dupliquer la logique — utilisé par les listes qui
 * n'affichent l'historique qu'à la demande, pour éviter qu'un historique de
 * plusieurs années ne se retrouve entièrement déplié dès l'ouverture de la
 * page.
 */
export function splitRecentAndHistorique<T>(
  items: T[],
  getDate: (item: T) => Date,
  now: Date = new Date(),
): {
  recent: T[];
  historique: T[];
  cutoffYear: number;
} {
  const cutoffYear = now.getFullYear() - (RECENT_YEARS_WINDOW - 1);
  const recent: T[] = [];
  const historique: T[] = [];
  for (const item of items) {
    if (getDate(item).getFullYear() >= cutoffYear) recent.push(item);
    else historique.push(item);
  }
  return { recent, historique, cutoffYear };
}

export type YearGroup<T> = {
  year: number;
  items: T[];
  totalCents: number;
};

/** Regroupe des éléments datés par année, la plus récente en tête. */
export function groupByYear<T>(
  items: T[],
  getDate: (item: T) => Date,
  getAmountCents: (item: T) => number,
): YearGroup<T>[] {
  const byYear = new Map<number, T[]>();
  for (const item of items) {
    const y = getDate(item).getFullYear();
    const bucket = byYear.get(y);
    if (bucket) bucket.push(item);
    else byYear.set(y, [item]);
  }
  return [...byYear.entries()]
    .map(([year, list]) => ({
      year,
      items: [...list].sort(
        (a, b) => getDate(b).getTime() - getDate(a).getTime(),
      ),
      totalCents: list.reduce((sum, item) => sum + getAmountCents(item), 0),
    }))
    .sort((a, b) => b.year - a.year);
}
