export type YearGroup<T> = { key: string; label: string; items: T[] };

/**
 * Fusionne des événements d'activité par date décroissante. Neutre entre
 * Structure et Admin : la construction des événements reste spécifique à
 * chaque appelant (l'Admin ajoute les mouvements de Solde et le nom de
 * l'Asso, la Structure fusionne Soumise/Validée sous un seul `kind`) — seul
 * le tri est partagé ici.
 */
export function mergeActivityEvents<T extends { date: Date }>(
  events: T[],
): T[] {
  return [...events].sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Regroupe des éléments datés par année, la plus récente en tête. */
export function groupByYear<T>(
  items: T[],
  getDate: (item: T) => Date,
): YearGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = String(getDate(item).getFullYear());
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()]
    .map(([key, items]) => ({ key, label: key, items }))
    .sort((a, b) => b.key.localeCompare(a.key));
}
