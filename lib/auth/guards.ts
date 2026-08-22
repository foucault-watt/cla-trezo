import { notFound, redirect } from "next/navigation";
import {
  resolveStructureAccess,
  type StructureAccess,
} from "@/lib/auth/access";
import { DEMO_ASSO_SLUG } from "@/lib/auth/demo-config";
import { prisma } from "@/lib/prisma";
import { getDemoSession, getSession, type SessionUser } from "@/lib/session";

async function lookupAssoBySlug(slug: string) {
  return prisma.asso.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });
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
  // L'Asso démo vit sur son propre cookie de session (cf. lib/session.ts) et
  // n'est jamais résolue via la vraie session, même Admin — coexistence
  // simple, sans précédence à arbitrer entre les deux cookies.
  if (assoSlug === DEMO_ASSO_SLUG) {
    const demoSession = await getDemoSession();
    const result = await resolveStructureAccess(
      demoSession.user,
      assoSlug,
      lookupAssoBySlug,
    );

    if (!result.ok) {
      redirect("/");
    }

    const { ok: _ok, ...structure } = result;
    return { structure, user: demoSession.user! };
  }

  const session = await getSession();
  const result = await resolveStructureAccess(
    session.user,
    assoSlug,
    lookupAssoBySlug,
  );

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

/**
 * Garde-fou pour l'espace admin : redirige vers /login si non connecté,
 * 404 si connecté mais pas Admin (pas de redirection vers l'espace membre
 * ici, ce choix est fait une fois au login/à la racine de /app).
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) {
    notFound();
  }
  return user;
}
