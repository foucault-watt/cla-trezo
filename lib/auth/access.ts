import type { SessionUser } from "@/lib/session";

export type StructureAccess = {
  assoId: string;
  slug: string;
  name: string;
  role: string | null;
};

export type AccessResult =
  | ({ ok: true } & StructureAccess)
  | { ok: false; reason: "unauthenticated" | "forbidden" };

/**
 * Décide si `user` peut accéder à la Structure `assoSlug` :
 * - membre de la structure -> accès avec son rôle
 * - Admin -> accès à toute structure existante (role: null, pas de membership)
 * - sinon -> refusé
 *
 * Logique pure : `lookupAsso` est injecté pour rester testable sans Prisma.
 */
export async function resolveStructureAccess(
  user: SessionUser | undefined,
  assoSlug: string,
  lookupAsso: (slug: string) => Promise<{ id: string; name: string } | null>,
): Promise<AccessResult> {
  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  const membership = user.structures.find((s) => s.slug === assoSlug);
  if (membership) {
    return { ok: true, ...membership };
  }

  if (user.isAdmin) {
    const asso = await lookupAsso(assoSlug);
    if (!asso) {
      return { ok: false, reason: "forbidden" };
    }
    return { ok: true, assoId: asso.id, slug: assoSlug, name: asso.name, role: null };
  }

  return { ok: false, reason: "forbidden" };
}

/**
 * Accès d'un Admin à une Structure dont il n'est pas membre (role: null) :
 * lecture seule pour les Notes de frais de l'espace Structure — il ne les
 * modifie qu'après les avoir prises en charge, depuis l'espace Admin
 * (cf. ADR-0001, requireStructureMember).
 */
export function isReadOnlyAdminAccess(structure: StructureAccess): boolean {
  return structure.role === null;
}
