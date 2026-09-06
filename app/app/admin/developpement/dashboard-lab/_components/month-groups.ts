const monthFormat = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});
const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

export function formatDay(iso: string): string {
  return dayFormat.format(new Date(iso));
}

export function formatMonth(iso: string): string {
  const label = monthFormat.format(new Date(iso));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // "2026-09"
}

export function groupByMonth<T extends { date: string }>(
  items: T[],
): { key: string; label: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = monthKey(item.date);
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()].map(([key, items]) => ({
    key,
    label: formatMonth(items[0].date),
    items,
  }));
}

export function yearKey(iso: string): string {
  return iso.slice(0, 4); // "2026"
}

export function groupByYear<T extends { date: string }>(
  items: T[],
): { key: string; label: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = yearKey(item.date);
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.entries()]
    .map(([key, items]) => ({ key, label: key, items }))
    .sort((a, b) => b.key.localeCompare(a.key));
}
