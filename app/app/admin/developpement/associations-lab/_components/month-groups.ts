const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

export function formatDay(iso: string): string {
  return dayFormat.format(new Date(iso));
}
