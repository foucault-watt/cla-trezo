/**
 * Une Visite = une suite de pages vues sans pause de plus de 30 minutes. La
 * session reste ouverte 30 jours (cf. lib/session.ts) : les connexions SSO
 * (UserLog) sous-estiment donc l'usage réel, d'où ce découpage.
 */
export const VISIT_GAP_MS = 30 * 60 * 1000;

export type VisitSummary = {
  visits: number;
  /** Temps entre la première et la dernière page de chaque Visite, cumulé.
   * Une Visite d'une seule page compte pour 0. */
  activeMs: number;
  /** Jours calendaires (UTC) avec au moins une page vue. */
  activeDays: number;
};

export function summarizeVisits(timestamps: Date[]): VisitSummary {
  const sorted = timestamps.map((date) => date.getTime()).sort((a, b) => a - b);
  if (sorted.length === 0) return { visits: 0, activeMs: 0, activeDays: 0 };

  let visits = 1;
  let activeMs = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    const gap = sorted[index] - sorted[index - 1];
    if (gap > VISIT_GAP_MS) {
      visits += 1;
    } else {
      activeMs += gap;
    }
  }

  const days = new Set(
    sorted.map((time) => new Date(time).toISOString().slice(0, 10)),
  );
  return { visits, activeMs, activeDays: days.size };
}
