import { MemberLoginBadge } from "@/components/asso/member-login-badge";
import { formatShortDate } from "@/lib/dates";
import type { AssoMemberWithLogin } from "@/lib/asso/members";

/**
 * Liste des Membres actifs d'une Structure, pour savoir qui contacter dans
 * l'onglet Aperçu de la page Admin détail d'Asso. La fraîcheur de connexion
 * (cf. MemberLoginBadge) prévient qu'un rôle affiché peut ne plus être à
 * jour sans que ce soit une anomalie.
 */
export function MembersList({ members }: { members: AssoMemberWithLogin[] }) {
  if (members.length === 0) {
    return (
      <p className="text-sm text-base-content/60">Aucun Membre actif.</p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-base-200">
      {members.map((member) => (
        <li
          key={member.userId}
          className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
        >
          <div>
            <span className="font-medium">
              {member.firstname} {member.lastname}
            </span>
            <span className="ml-2 badge badge-ghost badge-sm">
              {member.role}
            </span>
            <div className="mt-0.5 text-xs text-base-content/50">
              Depuis le {formatShortDate(member.since)}
            </div>
          </div>
          <MemberLoginBadge lastLoginAt={member.lastLoginAt} />
        </li>
      ))}
    </ul>
  );
}
