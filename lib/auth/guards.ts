import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import {
  isReadOnlyAdminAccess,
  resolveStructureAccess,
  type StructureAccess,
} from "@/lib/auth/access";
import { getSessionUserForAsso, lookupAssoBySlug } from "@/lib/auth/asso-session";
import { DEMO_ASSO_SLUG } from "@/lib/auth/demo-config";
import { getSession, type SessionUser } from "@/lib/session";

/**
 * Garde-fou à utiliser dans les Server Components / Server Actions : redirige
 * vers /login si non connecté, 404 si la structure n'existe pas ou n'est pas
 * accessible à l'utilisateur. Retourne aussi l'utilisateur pour éviter un
 * second appel à getSession() côté appelant.
 *
 * Enveloppé dans `cache()` : layout, page et generateMetadata l'appellent
 * pour la même Asso dans un même rendu.
 */
export const requireStructureAccess = cache(async function (
  assoSlug: string,
): Promise<{ structure: StructureAccess; user: SessionUser }> {
  // Le cookie lu dépend de l'Asso (démo ou réelle), cf. getSessionUserForAsso.
  const user = await getSessionUserForAsso(assoSlug);
  const result = await resolveStructureAccess(user, assoSlug, lookupAssoBySlug);

  if (!result.ok) {
    // Session démo absente ou expirée : retour à l'accueil, d'où l'on relance
    // la démo, plutôt que vers le SSO CLA.
    if (assoSlug === DEMO_ASSO_SLUG) {
      redirect("/");
    }
    if (result.reason === "unauthenticated") {
      redirect("/login");
    }
    notFound();
  }

  const { ok: _ok, ...structure } = result;
  return { structure, user: user! };
});

/**
 * Comme requireStructureAccess, mais réservé aux membres de la Structure :
 * pour les Server Actions qui modifient une Note de frais depuis l'espace
 * Structure. Un Admin non membre n'y a qu'un accès en lecture — il ne modifie
 * une Note qu'après l'avoir prise en charge, depuis l'espace Admin (cf.
 * ADR-0001). L'écran masque déjà les contrôles (cf. isReadOnlyAdminAccess) ;
 * ce garde-fou couvre une page restée ouverte ou une requête forgée.
 */
export async function requireStructureMember(
  assoSlug: string,
): Promise<{ structure: StructureAccess; user: SessionUser }> {
  const access = await requireStructureAccess(assoSlug);
  if (isReadOnlyAdminAccess(access.structure)) {
    notFound();
  }
  return access;
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
