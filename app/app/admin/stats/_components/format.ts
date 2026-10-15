const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function formatDateTime(date: Date | null): string {
  return date ? dateTimeFormatter.format(date) : "Jamais";
}

/** « 12 oct. » pour une clé de jour AAAA-MM-JJ. */
export function formatDayKey(day: string): string {
  return dayFormatter.format(new Date(`${day}T00:00:00Z`));
}

/** « il y a 3 j », « il y a 2 h »… — fraîcheur d'une activité. */
export function formatAgo(date: Date | null, now = new Date()): string {
  if (!date) return "Jamais";
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 60) return `il y a ${days} j`;
  return `il y a ${Math.round(days / 30)} mois`;
}

export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest}` : `${hours} h`;
}

export const DEVICE_LABELS: Record<string, string> = {
  mobile: "Mobile",
  tablet: "Tablette",
  desktop: "Ordinateur",
};

/** Lit le filtre « avec les Admins » d'une URL (?admins=1). */
export function includeAdminsParam(value: string | string[] | undefined) {
  return value === "1";
}

export function pageParam(value: string | string[] | undefined): number {
  const page = Number(typeof value === "string" ? value : 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function stringParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}
