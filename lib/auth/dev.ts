import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";
import { isDevAuthBypassEnabled } from "@/lib/auth/dev-config";

const DEFAULT_DEV_USER = {
  id: "00000000-0000-4000-8000-000000000001",
  username: "dev-agent",
  firstname: "Agent",
  lastname: "Développement",
  isAdmin: true,
} satisfies Omit<SessionUser, "structures">;

type DevAssociation = {
  id: string;
  slug: string;
  name: string;
};

type DevMembership = {
  assoId: string;
  role: string;
};

function buildDevStructures(
  associations: DevAssociation[],
  memberships: DevMembership[] = [],
): SessionUser["structures"] {
  const rolesByAssociation = new Map(
    memberships.map(({ assoId, role }) => [assoId, role]),
  );

  return associations.map((association) => ({
    assoId: association.id,
    slug: association.slug,
    name: association.name,
    role: rolesByAssociation.get(association.id) ?? "Accès développement",
  }));
}

export function buildDefaultDevUser(
  associations: DevAssociation[],
): SessionUser {
  return {
    ...DEFAULT_DEV_USER,
    structures: buildDevStructures(associations),
  };
}

/**
 * Construit l'identité de la session de développement. Par défaut elle est
 * synthétique et suffit aux parcours de lecture. DEV_AUTH_USERNAME permet
 * d'utiliser un utilisateur réel de la base pour les parcours qui écrivent.
 */
export async function getDevSessionUser(): Promise<SessionUser> {
  if (!isDevAuthBypassEnabled()) {
    throw new Error(
      "Le bypass d'authentification de développement est désactivé.",
    );
  }

  const associations = await prisma.asso.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });

  const username = process.env.DEV_AUTH_USERNAME?.trim();
  if (!username) {
    return buildDefaultDevUser(associations);
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      memberships: {
        select: { assoId: true, role: true },
      },
    },
  });

  if (!user) {
    throw new Error(
      `DEV_AUTH_USERNAME ne correspond à aucun utilisateur : ${username}`,
    );
  }

  return {
    id: user.id,
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    isAdmin: true,
    structures: buildDevStructures(associations, user.memberships),
  };
}
