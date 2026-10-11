import { LogIn, TriangleAlert } from "lucide-react";
import { formatShortDate } from "@/lib/dates";
import { loginFreshness } from "@/lib/asso/member-login";

/**
 * Badge de fraîcheur de connexion d'un Membre — cf. lib/asso/member-login.ts
 * pour la différence entre un Membre importé par la synchro Admin (jamais
 * connecté) et un Membre qui a réellement ouvert Trezo.
 */
export function MemberLoginBadge({ lastLoginAt }: { lastLoginAt: Date | null }) {
  if (lastLoginAt === null) {
    return (
      <span className="text-xs text-base-content/50">Jamais connecté·e</span>
    );
  }

  if (loginFreshness(lastLoginAt) === "stale") {
    return (
      <span
        className="tooltip tooltip-left"
        data-tip="Pas revu·e sur Trezo depuis plus de 6 mois."
      >
        <span className="badge badge-warning badge-soft badge-sm gap-1">
          <TriangleAlert size={12} />
          Vu·e le {formatShortDate(lastLoginAt)}
        </span>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs text-base-content/60">
      <LogIn size={12} />
      Connecté·e le {formatShortDate(lastLoginAt)}
    </span>
  );
}
