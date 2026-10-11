/**
 * Fraîcheur de la dernière connexion d'un Membre d'Asso (RefAssoUser).
 *
 * Un Membre peut n'avoir jamais ouvert Trezo : la synchro complète du
 * catalogue à la connexion d'un Admin (cf. ADR-0009,
 * lib/auth/cla.ts::syncAllAssociationsFromCla) crée les comptes et les rôles
 * de tous les membres renvoyés par le SSO, sans UserLog. Seule une vraie
 * connexion de la personne en écrit un (cf.
 * app/api/auth/cla/callback/route.ts) : la date d'import du rôle n'est donc
 * jamais une date de connexion.
 *
 * Au-delà de STALE_LOGIN_DAYS, la dernière connexion est signalée comme
 * ancienne : la personne n'est peut-être plus le bon contact.
 */
export const STALE_LOGIN_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

export type LoginFreshness = "never" | "stale" | "recent";

export function daysSinceLogin(lastLoginAt: Date, now: Date = new Date()): number {
  return (now.getTime() - lastLoginAt.getTime()) / DAY_MS;
}

export function isStaleLogin(lastLoginAt: Date, now: Date = new Date()): boolean {
  return daysSinceLogin(lastLoginAt, now) >= STALE_LOGIN_DAYS;
}

export function loginFreshness(
  lastLoginAt: Date | null,
  now: Date = new Date(),
): LoginFreshness {
  if (lastLoginAt === null) return "never";
  return isStaleLogin(lastLoginAt, now) ? "stale" : "recent";
}
