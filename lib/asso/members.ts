import { prisma } from "@/lib/prisma";

export type AssoMember = {
  userId: string;
  firstname: string;
  lastname: string;
  role: string;
};

/**
 * Membres actuellement actifs d'une Structure (cf. ref_asso_user), utilisés
 * pour regrouper visuellement les Lignes de note de frais par bénéficiaire
 * (le rattachement Rôle↔Personne existe déjà en base, pas de nouvelle
 * relation nécessaire).
 */
export async function listActiveAssoMembers(
  assoId: string,
): Promise<AssoMember[]> {
  const memberships = await prisma.refAssoUser.findMany({
    where: { assoId, isActive: true },
    include: { user: { select: { id: true, firstname: true, lastname: true } } },
    orderBy: [
      { user: { lastname: "asc" } },
      { user: { firstname: "asc" } },
    ],
  });

  return memberships.map((membership) => ({
    userId: membership.user.id,
    firstname: membership.user.firstname,
    lastname: membership.user.lastname,
    role: membership.role,
  }));
}
