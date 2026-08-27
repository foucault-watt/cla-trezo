const RECENT_YEARS_WINDOW = 2;

type Groupable = { createdAt: Date; totalAmountCents: number };

/**
 * Sépare des Notes de frais entre "récentes" (année en cours + année
 * précédente) et "historique" (tout le reste). Générique sur `T` pour être
 * réutilisé par les deux formes d'overview (Structure et Admin, cf.
 * `ExpenseReportOverview` / `ExpenseReportOverviewForAdmin`) sans dupliquer
 * la logique — utilisé par les listes qui n'affichent l'historique qu'à la
 * demande, pour éviter qu'une Structure avec plusieurs années d'archives ne
 * se retrouve avec une liste interminable dès l'ouverture de la page.
 */
export function splitRecentAndHistorique<T extends Groupable>(
  reports: T[],
  now: Date = new Date(),
): {
  recent: T[];
  historique: T[];
  cutoffYear: number;
} {
  const cutoffYear = now.getFullYear() - (RECENT_YEARS_WINDOW - 1);
  const recent: T[] = [];
  const historique: T[] = [];
  for (const r of reports) {
    if (r.createdAt.getFullYear() >= cutoffYear) recent.push(r);
    else historique.push(r);
  }
  return { recent, historique, cutoffYear };
}

export type YearGroup<T> = {
  year: number;
  reports: T[];
  totalCents: number;
};

/** Regroupe des Notes de frais par année de création, la plus récente en tête. */
export function groupByYear<T extends Groupable>(reports: T[]): YearGroup<T>[] {
  const byYear = new Map<number, T[]>();
  for (const r of reports) {
    const y = r.createdAt.getFullYear();
    const bucket = byYear.get(y);
    if (bucket) bucket.push(r);
    else byYear.set(y, [r]);
  }
  return [...byYear.entries()]
    .map(([year, list]) => ({
      year,
      reports: [...list].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ),
      totalCents: list.reduce((sum, r) => sum + r.totalAmountCents, 0),
    }))
    .sort((a, b) => b.year - a.year);
}

export function sumCents<T extends { totalAmountCents: number }>(
  reports: T[],
): number {
  return reports.reduce((sum, r) => sum + r.totalAmountCents, 0);
}
