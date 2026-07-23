import { notFound, redirect } from "next/navigation";
import { resolveStructureAccess, type StructureAccess } from "@/lib/auth/access";
import { prisma } from "@/lib/prisma";
import { getSession, type SessionUser } from "@/lib/session";

async function lookupAssoBySlug(slug: string) {
  return prisma.asso.findUnique({ where: { slug }, select: { id: true, name: true } });
}

/**
 * Garde-fou à utiliser dans les Server Components / Server Actions : redirige
 * vers /login si non connecté, 404 si la structure n'existe pas ou n'est pas
 * accessible à l'utilisateur. Retourne aussi l'utilisateur pour éviter un
 * second appel à getSession() côté appelant.
 */
export async function requireStructureAccess(
  assoSlug: string,
): Promise<{ structure: StructureAccess; user: SessionUser }> {
  const session = await getSession();
  const result = await resolveStructureAccess(session.user, assoSlug, lookupAssoBySlug);

  if (!result.ok) {
    if (result.reason === "unauthenticated") {
      redirect("/login");
    }
    notFound();
  }

  const { ok: _ok, ...structure } = result;
  return { structure, user: session.user! };
}

/**
 * Garde-fou minimal pour les Server Actions qui n'ont pas besoin de scoping
 * par Structure, seulement d'une session valide.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session.user) {
    redirect("/login");
  }
  return session.user;
}
