import { DEMO_ASSO_SLUG } from "@/lib/auth/demo-config";
import { prisma } from "@/lib/prisma";
import { getDemoSession, getSession, type SessionUser } from "@/lib/session";

/**
 * Utilisateur à considérer pour une requête portant sur l'Asso `assoSlug`.
 * L'Asso démo vit sur son propre cookie de session (cf. lib/session.ts) et
 * n'est jamais résolue via la vraie session, même Admin — coexistence
 * simple, sans précédence à arbitrer entre les deux cookies (cf. proxy.ts,
 * qui applique la même règle en amont).
 *
 * Point unique de cette règle : pages et Server Actions (requireStructureAccess)
 * comme Route Handlers (lib/auth/route-access.ts) passent par ici.
 */
export async function getSessionUserForAsso(
  assoSlug: string,
): Promise<SessionUser | undefined> {
  const session =
    assoSlug === DEMO_ASSO_SLUG ? await getDemoSession() : await getSession();
  return session.user;
}

/** `lookupAsso` par défaut de resolveStructureAccess (cf. lib/auth/access.ts). */
export async function lookupAssoBySlug(slug: string) {
  return prisma.asso.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
}
