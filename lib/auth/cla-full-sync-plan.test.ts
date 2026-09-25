import { describe, expect, it } from "vitest";
import {
  planClaSync,
  type ClaSyncAssociation,
  type ClaSyncExisting,
} from "./cla-sync-plan";

const member = {
  username: "alice",
  firstName: "Alice",
  lastName: "Martin",
  role: "Président",
};
const catalog: ClaSyncAssociation[] = [
  { slug: "rock", name: "Club Rock", type: "CLUB", members: [member] },
];
const empty: ClaSyncExisting = { assos: [], users: [], roles: [] };
function full(
  existing = empty,
  allAssociations: ClaSyncAssociation[] | undefined = catalog,
) {
  return planClaSync(
    existing,
    { username: "admin", associationRoles: [], allAssociations },
    "full",
  );
}
function asso(
  slug: string,
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED" = "ACTIVE",
  isDemo = false,
) {
  return { id: slug, slug, name: slug, status, isDemo, type: null };
}

describe("planClaSync, catalogue complet", () => {
  it("crée les Structures avec leur Type et les membres jamais connectés sans privilèges", () => {
    const plan = full();
    expect(plan.assosToCreate).toEqual([
      { slug: "rock", name: "Club Rock", type: "CLUB", status: "ACTIVE" },
    ]);
    expect(plan.usersToCreate).toEqual([
      {
        username: "alice",
        firstname: "Alice",
        lastname: "Martin",
        isAdmin: false,
        group: null,
      },
    ]);
    expect(plan.rolesToCreate).toEqual([
      { username: "alice", assoSlug: "rock", role: "Président" },
    ]);
    expect(plan.userRoles).toEqual([]);
  });

  it("impose nom et Type, réactive les présentes et désactive les absentes sans les supprimer", () => {
    const plan = full({
      ...empty,
      assos: [
        asso("rock", "INACTIVE"),
        asso("lost"),
        asso("already-inactive", "INACTIVE"),
      ],
    });
    expect(plan.assosToUpdate).toEqual([
      { id: "rock", name: "Club Rock", type: "CLUB", status: "ACTIVE" },
      { id: "lost", status: "INACTIVE" },
    ]);
    expect(plan.assosToCreate).toEqual([]);
  });

  it.each([true, false])(
    "préserve ARCHIVED et démo, y compris leurs rôles (présentes : %s)",
    (present) => {
      const assos = [
        asso("archived", "ARCHIVED"),
        asso("demo", "ACTIVE", true),
      ];
      const plan = full(
        {
          ...empty,
          assos,
          roles: assos.map((a) => ({
            id: a.id,
            assoSlug: a.slug,
            username: "bob",
            role: "Ancien",
          })),
        },
        present ? assos.map((a) => ({ ...catalog[0], slug: a.slug })) : [],
      );
      expect(plan).toEqual({
        assosToCreate: [],
        assosToUpdate: [],
        usersToCreate: [],
        rolesToCreate: [],
        rolesToUpdate: [],
        roleIdsToDelete: [],
        userRoles: [],
      });
    },
  );

  it("aligne les rôles de tous les Users et conserve les comptes existants sans changer leurs données", () => {
    const plan = full({
      assos: [asso("rock"), asso("lost")],
      users: [{ username: "alice" }, { username: "bob" }],
      roles: [
        { id: "change", assoSlug: "rock", username: "alice", role: "Membre" },
        {
          id: "removed-member",
          assoSlug: "rock",
          username: "bob",
          role: "Membre",
        },
        {
          id: "removed-structure",
          assoSlug: "lost",
          username: "alice",
          role: "Membre",
        },
      ],
    });
    expect(plan.usersToCreate).toEqual([]);
    expect(plan.rolesToUpdate).toEqual([{ id: "change", role: "Président" }]);
    expect(plan.roleIdsToDelete).toEqual([
      "removed-member",
      "removed-structure",
    ]);
    expect(plan.rolesToCreate).toEqual([]);
  });

  it("fusionne les postes multiples et ne crée qu'un compte par personne et un rôle par couple", () => {
    const plan = full(empty, [
      {
        ...catalog[0],
        members: [member, member, { ...member, role: "Trésorier" }],
      },
      { ...catalog[0], slug: "jazz" },
    ]);
    expect(plan.usersToCreate).toHaveLength(1);
    expect(plan.rolesToCreate).toEqual([
      { username: "alice", assoSlug: "rock", role: "Président, Trésorier" },
      { username: "alice", assoSlug: "jazz", role: "Président" },
    ]);
  });

  it("supprime les doublons de rôles existants", () => {
    const plan = full({
      ...empty,
      assos: [asso("rock")],
      users: [{ username: "alice" }],
      roles: ["r1", "r2"].map((id) => ({
        id,
        username: "alice",
        assoSlug: "rock",
        role: "Président",
      })),
    });
    expect(plan.roleIdsToDelete).toEqual(["r2"]);
    expect(plan.rolesToCreate).toEqual([]);
  });

  it("un catalogue vide désactive toutes les Structures ordinaires et retire leurs rôles", () => {
    const plan = full(
      {
        ...empty,
        assos: [asso("rock")],
        roles: [
          { id: "r1", username: "alice", assoSlug: "rock", role: "Président" },
        ],
      },
      [],
    );
    expect(plan.assosToUpdate).toEqual([{ id: "rock", status: "INACTIVE" }]);
    expect(plan.roleIdsToDelete).toEqual(["r1"]);
  });

  it("un catalogue absent ne provoque aucune modification", () => {
    const plan = planClaSync(
      { ...empty, assos: [asso("rock")] },
      { username: "admin", associationRoles: [] },
      "full",
    );
    expect(plan.assosToUpdate).toEqual([]);
    expect(plan.roleIdsToDelete).toEqual([]);
  });

  it("est sans changement quand le catalogue correspond déjà à la base", () => {
    const plan = full({
      assos: [{ ...asso("rock"), name: "Club Rock", type: "CLUB" }],
      users: [{ username: "alice" }],
      roles: [
        { id: "r1", username: "alice", assoSlug: "rock", role: "Président" },
      ],
    });
    expect(Object.values(plan).every((entries) => entries.length === 0)).toBe(
      true,
    );
  });

  it("le périmètre user ignore le catalogue complet", () => {
    const plan = planClaSync(
      empty,
      { username: "admin", associationRoles: [], allAssociations: catalog },
      "user",
    );
    expect(Object.values(plan).every((entries) => entries.length === 0)).toBe(
      true,
    );
  });
});
