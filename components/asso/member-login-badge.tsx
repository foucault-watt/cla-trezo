import { LogIn, TriangleAlert } from "lucide-react";
import { formatShortDate } from "@/lib/dates";
import { isStaleLogin } from "@/lib/asso/member-login";

/**
 * Badge de fraîcheur de connexion d'un Membre — cf. lib/asso/member-login.ts
 * pour pourquoi "jamais connecté·e" n'existe pas et pourquoi c'est
 * l'ancienneté de la connexion (pas sa présence) qui est le signal utile.
 */
export function MemberLoginBadge({ lastLoginAt }: { lastLoginAt: Date }) {
  if (isStaleLogin(lastLoginAt)) {
    return (
      <span
        className="tooltip tooltip-left"
        data-tip="Pas revu depuis longtemps : son rôle actuel ici peut ne plus être à jour, il ne se rafraîchit qu'à sa prochaine connexion."
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
