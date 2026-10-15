/*
 * Durées de conservation (décidées avec CLA, cf. mentions légales) :
 * - analytics nominatives (PageView, UserLog) : 13 mois, en mois entiers,
 *   puis agrégées sans identifiant dans UsageMonthlyStat ;
 * - journal d'audit : 10 ans, comme les pièces comptables.
 */

export const ANALYTICS_RETENTION_MONTHS = 13;
export const AUDIT_RETENTION_YEARS = 10;

/**
 * Début (UTC) du plus ancien mois conservé en détail : tout ce qui précède
 * est agrégé puis supprimé. Mois entiers, pour qu'un mois ne soit jamais
 * agrégé à moitié.
 */
export function analyticsCutoff(now: Date): Date {
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - ANALYTICS_RETENTION_MONTHS,
      1,
    ),
  );
}

export function auditCutoff(now: Date): Date {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - AUDIT_RETENTION_YEARS);
  return cutoff;
}
