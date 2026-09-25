import type { AssoStatus, AssoType } from "@/app/generated/prisma/enums";

/**
 * Planification pure de la synchronisation Trezo ← SSO CLA : à partir de
 * l'existant en base et de la réponse du SSO, calcule les changements à
 * appliquer (cf. syncUserFromCla dans lib/auth/cla.ts, qui lit l'existant et
 * applique le plan). Cf. ADR-0008.
 *
 * Le SSO CLA fait foi pour les rôles : un rôle qu'il ne renvoie plus est
 * supprimé, un poste changé met à jour la ligne existante, sans historique.
 * Une seule ligne par couple User × Structure : plusieurs postes dans la
 * même Structure sont fusionnés en un seul rôle ("Président, Trésorier").
 *
 * Le SSO fait aussi foi pour le nom et le Type des Structures qu'il renvoie ;
 * sans Type SSO (service non autorisé côté SSO), le Type existant est gardé.
 *
 * Une Structure ARCHIVED ou de démo n'est jamais modifiée : ni nom, ni Type,
 * ni rôles.
 * La session n'y donne accès que via un rôle déjà en base, confirmé par le SSO.
 *
 * Périmètre `user` (toute connexion) : n'aligne que les rôles de
 * l'utilisateur connecté, crée les Structures inconnues en ACTIVE, suit le
 * nom et le Type renvoyés par le SSO et ne change jamais le statut d'une
 * Structure.
 * Périmètre `full` (catalogue Admin) : aligne toutes les Structures et tous
 * les membres, crée les comptes manquants et bascule ACTIVE ↔ INACTIVE.
 * Les comptes existants et les Structures sont toujours conservés (ADR-0009).
 */

export type ClaSyncScope = "user" | "full";

export type ClaSyncExistingAsso = {
  id: string;
  slug: string;
  name: string;
  status: AssoStatus;
  isDemo: boolean;
  type: AssoType | null;
};

export type ClaSyncExistingRole = {
  id: string;
  username: string;
  assoSlug: string;
  role: string;
};

export type ClaSyncExisting = {
  assos: ClaSyncExistingAsso[];
  roles: ClaSyncExistingRole[];
  users?: { username: string }[];
};

export type ClaSyncAssociation = {
  slug: string;
  name: string;
  type: AssoType;
  members: {
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  }[];
};

export type ClaSyncSsoRole = {
  associationSlug: string;
  associationName: string;
  role: string;
  associationType?: AssoType;
};

export type ClaSyncSso = {
  username: string;
  associationRoles: ClaSyncSsoRole[];
  allAssociations?: ClaSyncAssociation[];
};

export type ClaSyncPlan = {
  assosToCreate: {
    slug: string;
    name: string;
    status: AssoStatus;
    type: AssoType | null;
  }[];
  /** Seuls les champs qui changent sont présents. */
  assosToUpdate: {
    id: string;
    name?: string;
    type?: AssoType;
    status?: AssoStatus;
  }[];
  usersToCreate: {
    username: string;
    firstname: string;
    lastname: string;
    isAdmin: false;
    group: null;
  }[];
  rolesToCreate: { username: string; assoSlug: string; role: string }[];
  rolesToUpdate: { id: string; role: string }[];
  roleIdsToDelete: string[];
  /** Rôles de l'utilisateur connecté après synchro, pour sa session. */
  userRoles: { assoSlug: string; assoName: string; role: string }[];
};

function isProtected(asso: ClaSyncExistingAsso): boolean {
  return asso.status === "ARCHIVED" || asso.isDemo;
}

/** Un rôle par Structure : postes multiples fusionnés dans l'ordre du SSO. */
function mergeRolesBySlug(roles: ClaSyncSsoRole[]): ClaSyncSsoRole[] {
  const bySlug = new Map<
    string,
    { name: string; type?: AssoType; roles: string[] }
  >();
  for (const entry of roles) {
    const merged = bySlug.get(entry.associationSlug);
    if (!merged) {
      bySlug.set(entry.associationSlug, {
        name: entry.associationName,
        type: entry.associationType,
        roles: [entry.role],
      });
    } else if (!merged.roles.includes(entry.role)) {
      merged.roles.push(entry.role);
    }
  }
  return [...bySlug].map(([associationSlug, { name, type, roles }]) => ({
    associationSlug,
    associationName: name,
    associationType: type,
    role: roles.join(", "),
  }));
}

function assoUpdate(
  asso: ClaSyncExistingAsso,
  entry: ClaSyncSsoRole,
): ClaSyncPlan["assosToUpdate"][number] | null {
  const update: ClaSyncPlan["assosToUpdate"][number] = { id: asso.id };
  if (asso.name !== entry.associationName) update.name = entry.associationName;
  if (entry.associationType && asso.type !== entry.associationType) {
    update.type = entry.associationType;
  }
  return Object.keys(update).length > 1 ? update : null;
}

export function planClaSync(
  existing: ClaSyncExisting,
  sso: ClaSyncSso,
  scope: ClaSyncScope,
): ClaSyncPlan {
  const plan: ClaSyncPlan = {
    assosToCreate: [],
    assosToUpdate: [],
    usersToCreate: [],
    rolesToCreate: [],
    rolesToUpdate: [],
    roleIdsToDelete: [],
    userRoles: [],
  };

  const assoBySlug = new Map(existing.assos.map((asso) => [asso.slug, asso]));
  if (scope === "full") {
    // L'absence du catalogue n'est surtout pas un catalogue vide.
    if (sso.allAssociations === undefined) return plan;
    if (existing.users === undefined) {
      throw new Error(
        "La synchro complète exige la liste des utilisateurs existants.",
      );
    }
    const catalog = new Map(
      sso.allAssociations.map((asso) => [asso.slug, asso]),
    );
    const knownUsers = new Set(existing.users.map((user) => user.username));
    const desiredRoles = new Map<
      string,
      { username: string; assoSlug: string; roles: Set<string> }
    >();
    const roleKey = (username: string, slug: string) =>
      JSON.stringify([username, slug]);

    for (const entry of catalog.values()) {
      const asso = assoBySlug.get(entry.slug);
      if (asso && isProtected(asso)) continue;
      if (!asso) {
        plan.assosToCreate.push({
          slug: entry.slug,
          name: entry.name,
          type: entry.type,
          status: "ACTIVE",
        });
      } else {
        const update = assoUpdate(asso, {
          associationSlug: entry.slug,
          associationName: entry.name,
          associationType: entry.type,
          role: "",
        }) ?? { id: asso.id };
        if (asso.status !== "ACTIVE") update.status = "ACTIVE";
        if (Object.keys(update).length > 1) plan.assosToUpdate.push(update);
      }
      for (const member of entry.members) {
        if (!knownUsers.has(member.username)) {
          knownUsers.add(member.username);
          plan.usersToCreate.push({
            username: member.username,
            firstname: member.firstName,
            lastname: member.lastName,
            isAdmin: false,
            group: null,
          });
        }
        const key = roleKey(member.username, entry.slug);
        const desired = desiredRoles.get(key) ?? {
          username: member.username,
          assoSlug: entry.slug,
          roles: new Set<string>(),
        };
        desired.roles.add(member.role);
        desiredRoles.set(key, desired);
      }
    }
    for (const asso of existing.assos) {
      if (
        !isProtected(asso) &&
        asso.status === "ACTIVE" &&
        !catalog.has(asso.slug)
      ) {
        plan.assosToUpdate.push({ id: asso.id, status: "INACTIVE" });
      }
    }
    for (const row of existing.roles) {
      const asso = assoBySlug.get(row.assoSlug);
      if (asso && isProtected(asso)) continue;
      const key = roleKey(row.username, row.assoSlug);
      const desired = desiredRoles.get(key);
      if (!desired) plan.roleIdsToDelete.push(row.id);
      else {
        const role = [...desired.roles].join(", ");
        if (row.role !== role) plan.rolesToUpdate.push({ id: row.id, role });
        desiredRoles.delete(key);
      }
    }
    for (const { username, assoSlug, roles } of desiredRoles.values()) {
      plan.rolesToCreate.push({
        username,
        assoSlug,
        role: [...roles].join(", "),
      });
    }
    return plan;
  }
  const ssoRoles = mergeRolesBySlug(sso.associationRoles);

  for (const entry of ssoRoles) {
    const asso = assoBySlug.get(entry.associationSlug);
    if (!asso) {
      plan.assosToCreate.push({
        slug: entry.associationSlug,
        name: entry.associationName,
        status: "ACTIVE",
        type: entry.associationType ?? null,
      });
    } else if (!isProtected(asso)) {
      const update = assoUpdate(asso, entry);
      if (update) plan.assosToUpdate.push(update);
    }
    if (!asso || !isProtected(asso)) {
      plan.userRoles.push({
        assoSlug: entry.associationSlug,
        assoName: entry.associationName,
        role: entry.role,
      });
    }
  }

  const ssoRoleBySlug = new Map(
    ssoRoles.map((entry) => [entry.associationSlug, entry.role]),
  );
  const keptSlugs = new Set<string>();
  const userExistingRoles = existing.roles.filter(
    (row) => row.username === sso.username,
  );

  for (const row of userExistingRoles) {
    const asso = assoBySlug.get(row.assoSlug);
    if (asso && isProtected(asso)) {
      // Rôle figé : la session le garde tel qu'en base tant que le SSO
      // confirme l'appartenance, pour que session et base restent d'accord.
      if (ssoRoleBySlug.has(row.assoSlug) && !keptSlugs.has(row.assoSlug)) {
        keptSlugs.add(row.assoSlug);
        plan.userRoles.push({
          assoSlug: row.assoSlug,
          assoName: asso.name,
          role: row.role,
        });
      }
      continue;
    }

    const ssoRole = ssoRoleBySlug.get(row.assoSlug);
    if (ssoRole === undefined || keptSlugs.has(row.assoSlug)) {
      // Rôle perdu, ou ligne en double pour ce couple User × Structure.
      plan.roleIdsToDelete.push(row.id);
      continue;
    }
    keptSlugs.add(row.assoSlug);
    if (row.role !== ssoRole) {
      plan.rolesToUpdate.push({ id: row.id, role: ssoRole });
    }
  }

  for (const entry of ssoRoles) {
    const asso = assoBySlug.get(entry.associationSlug);
    if (asso && isProtected(asso)) continue;
    if (keptSlugs.has(entry.associationSlug)) continue;
    plan.rolesToCreate.push({
      username: sso.username,
      assoSlug: entry.associationSlug,
      role: entry.role,
    });
  }

  return plan;
}
