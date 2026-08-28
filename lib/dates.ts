const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/**
 * Date courte (jour/mois/année) utilisée dans les lignes denses de liste
 * (Notes de frais, Campagnes de subvention…) — format générique partagé,
 * indépendant du domaine.
 */
export function formatShortDate(date: Date): string {
  return shortDateFormatter.format(date);
}
