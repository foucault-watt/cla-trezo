import { LogIn, TriangleAlert } from "lucide-react";
import { STALE_LOGIN_DAYS, daysSince } from "./fixtures";

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatMemberDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

export function isStaleLogin(lastLoginAt: string): boolean {
  return daysSince(lastLoginAt) >= STALE_LOGIN_DAYS;
}

/**
 * L'objectif de la liste des membres est de permettre à quelqu'un de CLA de
 * savoir qui contacter dans une Asso — jamais d'afficher un e-mail (le
 * schéma n'en a pas : seul `username` identifie un User côté SSO CLA).
 *
 * "Jamais connecté·e" n'existe pas : on ne peut apparaître dans cette liste
 * qu'en s'étant déjà connecté au moins une fois (cf. lib/auth/cla.ts,
 * syncUserFromCla ne traite que les rôles de la personne qui se connecte
 * elle-même). Le vrai signal utile est la fraîcheur de cette connexion :
 * une connexion très ancienne veut dire que le rôle affiché n'a peut-être
 * plus été rafraîchi depuis longtemps (rien ne le met à jour tant que la
 * personne ne se reconnecte pas elle-même).
 */
export function MemberLoginBadge({ lastLoginAt }: { lastLoginAt: string }) {
  if (isStaleLogin(lastLoginAt)) {
    return (
      <span
        className="tooltip tooltip-left"
        data-tip="Pas revu depuis longtemps : son rôle actuel ici peut ne plus être à jour, il ne se rafraîchit qu'à sa prochaine connexion."
      >
        <span className="badge badge-warning badge-soft badge-sm gap-1">
          <TriangleAlert size={12} />
          Vu·e le {formatMemberDate(lastLoginAt)}
        </span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-base-content/60">
      <LogIn size={12} />
      Connecté·e le {formatMemberDate(lastLoginAt)}
    </span>
  );
}
