import type { AssoStatus } from "@/app/generated/prisma/enums";

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
 * Une Structure ARCHIVED ou de démo n'est jamais modifiée : ni nom, ni rôles.
 * La session n'y donne accès que via un rôle déjà en base, confirmé par le SSO.
 *
 * Périmètre `user` (toute connexion) : n'aligne que les rôles de
 * l'utilisateur connecté, crée les Structures inconnues en ACTIVE, suit le
 * nom renvoyé par le SSO et ne change jamais le statut d'une Structure.
 */

export type ClaSyncScope = "user";

export type ClaSyncExistingAsso = {
  id: string;
  slug: string;
  name: string;
  status: AssoStatus;
  isDemo: boolean;
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
};

export type ClaSyncSsoRole = {
  associationSlug: string;
  associationName: string;
  role: string;
};

export type ClaSyncSso = {
  username: string;
  associationRoles: ClaSyncSsoRole[];
};

export type ClaSyncPlan = {
  assosToCreate: { slug: string; name: string; status: AssoStatus }[];
  assosToRename: { id: string; name: string }[];
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
  const bySlug = new Map<string, { name: string; roles: string[] }>();
  for (const entry of roles) {
    const merged = bySlug.get(entry.associationSlug);
    if (!merged) {
      bySlug.set(entry.associationSlug, {
        name: entry.associationName,
        roles: [entry.role],
      });
    } else if (!merged.roles.includes(entry.role)) {
      merged.roles.push(entry.role);
    }
  }
  return [...bySlug].map(([associationSlug, { name, roles }]) => ({
    associationSlug,
    associationName: name,
    role: roles.join(", "),
  }));
}

export function planClaSync(
  existing: ClaSyncExisting,
  sso: ClaSyncSso,
  // Seul périmètre pour l'instant ; le périmètre `full` (catalogue complet
  // à la connexion Admin) viendra s'ajouter ici.
  scope: ClaSyncScope,
): ClaSyncPlan {
  void scope;

  const plan: ClaSyncPlan = {
    assosToCreate: [],
    assosToRename: [],
    rolesToCreate: [],
    rolesToUpdate: [],
    roleIdsToDelete: [],
    userRoles: [],
  };

  const assoBySlug = new Map(existing.assos.map((asso) => [asso.slug, asso]));
  const ssoRoles = mergeRolesBySlug(sso.associationRoles);

  for (const entry of ssoRoles) {
    const asso = assoBySlug.get(entry.associationSlug);
    if (!asso) {
      plan.assosToCreate.push({
        slug: entry.associationSlug,
        name: entry.associationName,
        status: "ACTIVE",
      });
    } else if (!isProtected(asso) && asso.name !== entry.associationName) {
      plan.assosToRename.push({ id: asso.id, name: entry.associationName });
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
