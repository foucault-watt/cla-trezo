import { describe, expect, it } from "vitest";
import {
  beneficiaryRepresentativesFromMembers,
  conventionPeriodForPublicationDate,
  formatConventionDate,
  responsibleNameFromMembers,
} from "./subsidy-convention";

describe("conventionPeriodForPublicationDate", () => {
  it("fait commencer la période le 1er septembre", () => {
    expect(
      conventionPeriodForPublicationDate(new Date("2025-08-31T12:00:00+02:00")),
    ).toBe("2024-2025");
    expect(
      conventionPeriodForPublicationDate(new Date("2025-09-01T12:00:00+02:00")),
    ).toBe("2025-2026");
    expect(
      conventionPeriodForPublicationDate(new Date("2025-10-15T12:00:00+02:00")),
    ).toBe("2025-2026");
  });

  it("utilise la date civile de Paris autour de minuit", () => {
    const parisMidnight = new Date("2025-09-01T00:30:00+02:00");
    expect(conventionPeriodForPublicationDate(parisMidnight)).toBe("2025-2026");
    expect(formatConventionDate(parisMidnight)).toBe("01/09/2025");
  });
});

describe("beneficiaryRepresentativesFromMembers", () => {
  it("précharge les membres dont le rôle contient président ou trésorier", () => {
    expect(
      beneficiaryRepresentativesFromMembers([
        { firstname: "Lina", lastname: "Martin", role: "Présidente" },
        { firstname: "Noé", lastname: "Durand", role: "Trésorier adjoint" },
        { firstname: "Lou", lastname: "Petit", role: "Secrétaire" },
      ]),
    ).toEqual([
      { name: "Lina MARTIN", role: "Présidente" },
      { name: "Noé DURAND", role: "Trésorier adjoint" },
    ]);
  });

  it("ajoute des champs à compléter pour les rôles introuvables", () => {
    expect(beneficiaryRepresentativesFromMembers([])).toEqual([
      { name: "", role: "Président" },
      { name: "", role: "Trésorier" },
    ]);
  });

  it("conserve exactement deux champs dans l'ordre président puis trésorier", () => {
    expect(
      beneficiaryRepresentativesFromMembers([
        { firstname: "A", lastname: "Un", role: "Co-trésorier" },
        { firstname: "B", lastname: "Deux", role: "Président" },
        { firstname: "C", lastname: "Trois", role: "Co-présidente" },
      ]),
    ).toEqual([
      { name: "B DEUX", role: "Président" },
      { name: "A UN", role: "Co-trésorier" },
    ]);
  });
});

describe("responsibleNameFromMembers", () => {
  it("préfère la présidence, sinon un rôle de responsable", () => {
    expect(
      responsibleNameFromMembers([
        { firstname: "Oscar", lastname: "Durand", role: "Responsable com" },
        { firstname: "Lina", lastname: "Martin", role: "Présidente" },
      ]),
    ).toBe("Lina MARTIN");
    expect(
      responsibleNameFromMembers([
        { firstname: "Oscar", lastname: "Durand", role: "Responsable" },
      ]),
    ).toBe("Oscar DURAND");
  });

  it("laisse le champ vide quand aucun rôle ne correspond", () => {
    expect(
      responsibleNameFromMembers([
        { firstname: "Lou", lastname: "Petit", role: "Secrétaire" },
      ]),
    ).toBe("");
  });
});
