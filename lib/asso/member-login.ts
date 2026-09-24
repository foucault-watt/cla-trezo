/**
 * Fraîcheur de la dernière connexion d'un Membre d'Asso (RefAssoUser).
 *
 * Il n'existe pas de cas "jamais connecté·e" : on ne peut apparaître dans
 * `RefAssoUser` qu'en s'étant déjà connecté au moins une fois (cf.
 * lib/auth/cla.ts::syncUserFromCla, qui ne synchronise que les rôles de la
 * personne qui se connecte elle-même — la création de la Ligne RefAssoUser
 * est donc toujours accompagnée de la création d'un UserLog, cf.
 * app/api/auth/cla/callback/route.ts).
 *
 * Le signal utile n'est donc pas "connecté ou pas", mais l'ANCIENNETÉ de
 * cette dernière connexion : au-delà de STALE_LOGIN_DAYS, le rôle affiché
 * peut être obsolète puisqu'il ne se rafraîchit qu'à la prochaine connexion
 * de cette personne (rien d'autre ne le met à jour entre-temps).
 */
export const STALE_LOGIN_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysSinceLogin(lastLoginAt: Date, now: Date = new Date()): number {
  return (now.getTime() - lastLoginAt.getTime()) / DAY_MS;
}

export function isStaleLogin(lastLoginAt: Date, now: Date = new Date()): boolean {
  return daysSinceLogin(lastLoginAt, now) >= STALE_LOGIN_DAYS;
}
