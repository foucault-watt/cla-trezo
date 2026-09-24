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

export type AssoMemberWithLogin = AssoMember & {
  /** Début du rôle actuel (RefAssoUser.createdAt). */
  since: Date;
  /** Dernier UserLog.connectedAt de ce Membre — cf. lib/asso/member-login.ts :
   * toujours renseigné, jamais null (cf. syncUserFromCla). */
  lastLoginAt: Date;
};

/**
 * Variante de listActiveAssoMembers avec la fraîcheur de connexion, pour la
 * page Admin détail d'Asso (onglet Aperçu) : savoir qui contacter, et
 * signaler quand le rôle affiché n'a peut-être pas été rafraîchi depuis
 * longtemps (cf. lib/asso/member-login.ts). Non fusionnée dans
 * listActiveAssoMembers pour ne pas alourdir ses autres appelants (groupage
 * des Lignes de note de frais par bénéficiaire), qui n'ont pas besoin de
 * l'agrégat UserLog.
 */
export async function listActiveAssoMembersWithLogin(
  assoId: string,
): Promise<AssoMemberWithLogin[]> {
  const memberships = await prisma.refAssoUser.findMany({
    where: { assoId, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          logs: { orderBy: { connectedAt: "desc" }, take: 1, select: { connectedAt: true } },
        },
      },
    },
    orderBy: [{ user: { lastname: "asc" } }, { user: { firstname: "asc" } }],
  });

  return memberships.map((membership) => ({
    userId: membership.user.id,
    firstname: membership.user.firstname,
    lastname: membership.user.lastname,
    role: membership.role,
    since: membership.createdAt,
    // Toujours présent en pratique (cf. commentaire du type) ; repli sur la
    // date du rôle si jamais un UserLog venait à manquer (donnée historique
    // incohérente) plutôt que de planter l'affichage.
    lastLoginAt: membership.user.logs[0]?.connectedAt ?? membership.createdAt,
  }));
}
