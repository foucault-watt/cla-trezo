import {
  resolveStructureAccess,
  type StructureAccess,
} from "@/lib/auth/access";
import { getSessionUserForAsso, lookupAssoBySlug } from "@/lib/auth/asso-session";
import { getSession, type SessionUser } from "@/lib/session";

/**
 * Équivalents pour Route Handler de requireStructureAccess / requireAdmin
 * (lib/auth/guards.ts) : ceux-ci s'appuient sur `redirect`/`notFound`, pensés
 * pour le rendu de page ; ici le refus est une `Response` prête à renvoyer —
 * 401 si personne n'est connecté, 404 sinon (on ne révèle pas l'existence
 * d'une Structure inaccessible).
 */
export type RouteAccess<T> = ({ ok: true } & T) | { ok: false; response: Response };

export async function resolveStructureRouteAccess(
  assoSlug: string,
): Promise<RouteAccess<{ structure: StructureAccess; user: SessionUser }>> {
  const user = await getSessionUserForAsso(assoSlug);
  const result = await resolveStructureAccess(user, assoSlug, lookupAssoBySlug);

  if (!result.ok) {
    const status = result.reason === "unauthenticated" ? 401 : 404;
    return { ok: false, response: new Response(null, { status }) };
  }

  const { ok: _ok, ...structure } = result;
  return { ok: true, structure, user: user! };
}

export async function resolveAdminRouteAccess(): Promise<
  RouteAccess<{ user: SessionUser }>
> {
  const { user } = await getSession();

  if (!user) {
    return { ok: false, response: new Response(null, { status: 401 }) };
  }
  if (!user.isAdmin) {
    return { ok: false, response: new Response(null, { status: 404 }) };
  }

  return { ok: true, user };
}
