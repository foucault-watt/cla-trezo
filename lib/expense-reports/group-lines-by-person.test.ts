import { describe, expect, it } from "vitest";
import { groupLinesByPerson } from "./group-lines-by-person";
import type { AssoMember } from "@/lib/asso/members";
import type { ExpenseReportLineDetail } from "./expense-report-detail-mapping";

function line(
  overrides: Partial<ExpenseReportLineDetail> & { id: string },
): ExpenseReportLineDetail {
  return {
    beneficiaryFirstname: "Jean",
    beneficiaryLastname: "Dupont",
    iban: null,
    amountCents: 1000,
    expenseName: "Taxi",
    typeDepenseId: null,
    typeDepenseLabel: null,
    customLabel: "Autre",
    fundingSource: "CLUB_BALANCE",
    subventionId: null,
    subventionReason: null,
    ...overrides,
  };
}

const MEMBERS: AssoMember[] = [
  { userId: "u1", firstname: "Jean", lastname: "Dupont", role: "Trésorier" },
  { userId: "u2", firstname: "Alice", lastname: "Martin", role: "Président" },
];

describe("groupLinesByPerson", () => {
  it("rattache une Ligne au Membre dont le nom correspond exactement", () => {
    const groups = groupLinesByPerson(
      [line({ id: "l1", beneficiaryFirstname: "Jean", beneficiaryLastname: "Dupont" })],
      MEMBERS,
    );

    const jean = groups.find((g) => g.key === "jean dupont");
    expect(jean).toMatchObject({ isKnownMember: true, role: "Trésorier" });
    expect(jean?.lines).toHaveLength(1);
  });

  it("ignore la casse et les espaces superflus pour la correspondance", () => {
    const groups = groupLinesByPerson(
      [line({ id: "l1", beneficiaryFirstname: " JEAN ", beneficiaryLastname: " dupont " })],
      MEMBERS,
    );

    const jean = groups.find((g) => g.key === "jean dupont");
    expect(jean?.isKnownMember).toBe(true);
    expect(jean?.lines).toHaveLength(1);
  });

  it("crée un groupe hors BDD pour un bénéficiaire sans Membre correspondant", () => {
    const groups = groupLinesByPerson(
      [line({ id: "l1", beneficiaryFirstname: "Paul", beneficiaryLastname: "Durand" })],
      MEMBERS,
    );

    const paul = groups.find((g) => g.key === "paul durand");
    expect(paul).toMatchObject({ isKnownMember: false, role: null });
    expect(paul?.lines).toHaveLength(1);
  });

  it("affiche un Membre actif sans Ligne comme un groupe vide", () => {
    const groups = groupLinesByPerson([], MEMBERS);

    const alice = groups.find((g) => g.key === "alice martin");
    expect(alice).toMatchObject({ isKnownMember: true, lines: [] });
  });

  it("regroupe deux Lignes hors BDD portant le même nom", () => {
    const groups = groupLinesByPerson(
      [
        line({ id: "l1", beneficiaryFirstname: "Paul", beneficiaryLastname: "Durand" }),
        line({ id: "l2", beneficiaryFirstname: "Paul", beneficiaryLastname: "Durand" }),
      ],
      MEMBERS,
    );

    const paul = groups.find((g) => g.key === "paul durand");
    expect(paul?.lines.map((l) => l.id)).toEqual(["l1", "l2"]);
  });

  it("calcule les totaux par source de financement pour une personne", () => {
    const groups = groupLinesByPerson(
      [
        line({
          id: "l1",
          fundingSource: "CLUB_BALANCE",
          amountCents: 1000,
        }),
        line({
          id: "l2",
          fundingSource: "SUBVENTION",
          amountCents: 500,
        }),
        line({
          id: "l3",
          fundingSource: "SUBVENTION",
          amountCents: 250,
        }),
      ],
      MEMBERS,
    );

    const jean = groups.find((g) => g.key === "jean dupont");
    expect(jean).toMatchObject({
      clubBalanceTotalCents: 1000,
      subventionTotalCents: 750,
    });
  });

  it("laisse les totaux à zéro pour un Membre sans Ligne", () => {
    const groups = groupLinesByPerson([], MEMBERS);

    const alice = groups.find((g) => g.key === "alice martin");
    expect(alice).toMatchObject({
      clubBalanceTotalCents: 0,
      subventionTotalCents: 0,
    });
  });

  it("trie tous les groupes ensemble par nom de famille puis prénom", () => {
    const groups = groupLinesByPerson(
      [line({ id: "l1", beneficiaryFirstname: "Paul", beneficiaryLastname: "Durand" })],
      MEMBERS,
    );

    expect(groups.map((g) => g.key)).toEqual([
      "jean dupont",
      "paul durand",
      "alice martin",
    ]);
  });
});
