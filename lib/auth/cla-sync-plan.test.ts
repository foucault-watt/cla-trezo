import { describe, expect, it } from "vitest";
import {
  planClaSync,
  type ClaSyncExisting,
  type ClaSyncExistingAsso,
} from "./cla-sync-plan";

function asso(
  overrides: Partial<ClaSyncExistingAsso> & { slug: string },
): ClaSyncExistingAsso {
  return {
    id: `id-${overrides.slug}`,
    name: overrides.slug.toUpperCase(),
    status: "ACTIVE",
    isDemo: false,
    ...overrides,
  };
}

function ssoRole(associationSlug: string, role: string, associationName?: string) {
  return {
    associationSlug,
    associationName: associationName ?? associationSlug.toUpperCase(),
    role,
  };
}

const EMPTY: ClaSyncExisting = { assos: [], roles: [] };

describe("planClaSync, périmètre user", () => {
  it("crée la Structure inconnue en ACTIVE et le rôle de l'utilisateur", () => {
    const plan = planClaSync(
      EMPTY,
      { username: "alice", associationRoles: [ssoRole("bde", "Trésorier", "BDE")] },
      "user",
    );

    expect(plan.assosToCreate).toEqual([
      { slug: "bde", name: "BDE", status: "ACTIVE" },
    ]);
    expect(plan.rolesToCreate).toEqual([
      { username: "alice", assoSlug: "bde", role: "Trésorier" },
    ]);
    expect(plan.rolesToUpdate).toEqual([]);
    expect(plan.roleIdsToDelete).toEqual([]);
    expect(plan.userRoles).toEqual([
      { assoSlug: "bde", assoName: "BDE", role: "Trésorier" },
    ]);
  });

  it("supprime un rôle que le SSO ne renvoie plus", () => {
    const plan = planClaSync(
      {
        assos: [asso({ slug: "bde" }), asso({ slug: "bda" })],
        roles: [
          { id: "r1", username: "alice", assoSlug: "bde", role: "Trésorier" },
          { id: "r2", username: "alice", assoSlug: "bda", role: "Président" },
        ],
      },
      { username: "alice", associationRoles: [ssoRole("bde", "Trésorier")] },
      "user",
    );

    expect(plan.roleIdsToDelete).toEqual(["r2"]);
    expect(plan.rolesToCreate).toEqual([]);
    expect(plan.rolesToUpdate).toEqual([]);
  });

  it("met à jour le poste sur la ligne existante quand il change", () => {
    const plan = planClaSync(
      {
        assos: [asso({ slug: "bde" })],
        roles: [{ id: "r1", username: "alice", assoSlug: "bde", role: "Secrétaire" }],
      },
      { username: "alice", associationRoles: [ssoRole("bde", "Trésorier")] },
      "user",
    );

    expect(plan.rolesToUpdate).toEqual([{ id: "r1", role: "Trésorier" }]);
    expect(plan.rolesToCreate).toEqual([]);
    expect(plan.roleIdsToDelete).toEqual([]);
  });

  it("ne change rien quand le SSO confirme l'existant", () => {
    const plan = planClaSync(
      {
        assos: [asso({ slug: "bde", name: "BDE" })],
        roles: [{ id: "r1", username: "alice", assoSlug: "bde", role: "Trésorier" }],
      },
      { username: "alice", associationRoles: [ssoRole("bde", "Trésorier", "BDE")] },
      "user",
    );

    expect(plan).toEqual({
      assosToCreate: [],
      assosToRename: [],
      rolesToCreate: [],
      rolesToUpdate: [],
      roleIdsToDelete: [],
      userRoles: [{ assoSlug: "bde", assoName: "BDE", role: "Trésorier" }],
    });
  });

  it("ne change jamais le statut d'une Structure, même INACTIVE", () => {
    const plan = planClaSync(
      {
        assos: [asso({ slug: "bde", name: "BDE", status: "INACTIVE" })],
        roles: [],
      },
      { username: "alice", associationRoles: [ssoRole("bde", "Trésorier", "Bureau des élèves")] },
      "user",
    );

    expect(plan.assosToCreate).toEqual([]);
    // Seul le nom suit le SSO ; aucune bascule de statut dans le plan.
    expect(plan.assosToRename).toEqual([{ id: "id-bde", name: "Bureau des élèves" }]);
    expect(plan.rolesToCreate).toEqual([
      { username: "alice", assoSlug: "bde", role: "Trésorier" },
    ]);
  });

  it("fusionne deux postes dans la même Structure en un seul rôle", () => {
    const plan = planClaSync(
      EMPTY,
      {
        username: "alice",
        associationRoles: [ssoRole("bde", "Président"), ssoRole("bde", "Trésorier")],
      },
      "user",
    );

    expect(plan.assosToCreate).toHaveLength(1);
    expect(plan.rolesToCreate).toEqual([
      { username: "alice", assoSlug: "bde", role: "Président, Trésorier" },
    ]);
    expect(plan.userRoles).toEqual([
      { assoSlug: "bde", assoName: "BDE", role: "Président, Trésorier" },
    ]);
  });

  it("supprime les lignes en double pour un même couple User × Structure", () => {
    const plan = planClaSync(
      {
        assos: [asso({ slug: "bde" })],
        roles: [
          { id: "r1", username: "alice", assoSlug: "bde", role: "Trésorier" },
          { id: "r2", username: "alice", assoSlug: "bde", role: "Secrétaire" },
        ],
      },
      { username: "alice", associationRoles: [ssoRole("bde", "Trésorier")] },
      "user",
    );

    expect(plan.roleIdsToDelete).toEqual(["r2"]);
    expect(plan.rolesToUpdate).toEqual([]);
    expect(plan.rolesToCreate).toEqual([]);
  });

  it("ne touche pas les rôles des autres utilisateurs", () => {
    const plan = planClaSync(
      {
        assos: [asso({ slug: "bde" })],
        roles: [{ id: "r9", username: "bob", assoSlug: "bde", role: "Président" }],
      },
      { username: "alice", associationRoles: [] },
      "user",
    );

    expect(plan.roleIdsToDelete).toEqual([]);
  });

  it("laisse intactes une Structure ARCHIVED ou démo et leurs rôles", () => {
    const plan = planClaSync(
      {
        assos: [
          asso({ slug: "old", name: "Ancienne", status: "ARCHIVED" }),
          asso({ slug: "demo", name: "Club Démo", isDemo: true }),
        ],
        roles: [
          { id: "r1", username: "alice", assoSlug: "old", role: "Président" },
          { id: "r2", username: "alice", assoSlug: "demo", role: "Trésorier" },
        ],
      },
      {
        username: "alice",
        associationRoles: [ssoRole("old", "Trésorier", "Nouveau nom")],
      },
      "user",
    );

    expect(plan.assosToRename).toEqual([]);
    expect(plan.rolesToUpdate).toEqual([]);
    expect(plan.rolesToCreate).toEqual([]);
    expect(plan.roleIdsToDelete).toEqual([]);
    // La session suit la base : rôle et nom figés, et la Structure démo que
    // le SSO ne renvoie pas n'y figure pas.
    expect(plan.userRoles).toEqual([
      { assoSlug: "old", assoName: "Ancienne", role: "Président" },
    ]);
  });

  it("ne donne pas accès à une Structure ARCHIVED sans rôle déjà en base", () => {
    const plan = planClaSync(
      { assos: [asso({ slug: "old", status: "ARCHIVED" })], roles: [] },
      { username: "alice", associationRoles: [ssoRole("old", "Trésorier")] },
      "user",
    );

    expect(plan.rolesToCreate).toEqual([]);
    expect(plan.userRoles).toEqual([]);
  });
});
