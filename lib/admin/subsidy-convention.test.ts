import { beforeEach, describe, expect, it, vi } from "vitest";

const { campaignFindUniqueMock, settingsFindUniqueMock } = vi.hoisted(() => ({
  campaignFindUniqueMock: vi.fn(),
  settingsFindUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subventionCampaign: { findUnique: campaignFindUniqueMock },
    conventionPdfSettings: { findUnique: settingsFindUniqueMock },
  },
}));

import {
  beneficiaryRepresentativesFromMembers,
  conventionPeriodForPublicationDate,
  formatConventionDate,
  getConventionPreparation,
} from "./subsidy-convention";

beforeEach(() => {
  campaignFindUniqueMock.mockReset();
  settingsFindUniqueMock.mockReset();
  settingsFindUniqueMock.mockResolvedValue(null);
});

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

describe("getConventionPreparation", () => {
  it("regroupe toutes les lignes de la campagne pour la même association", async () => {
    campaignFindUniqueMock.mockResolvedValue({
      id: "campaign-1",
      name: "CA Event octobre",
      publicationDate: new Date("2025-10-15T12:00:00+02:00"),
      subventions: [
        {
          reason: "WEAC",
          amountCents: 65000,
          asso: {
            id: "asso-1",
            name: "AEEC Lille",
            memberships: [
              {
                role: "Présidente",
                user: { firstname: "Yasmine", lastname: "Semiane" },
              },
            ],
          },
        },
        {
          reason: "Journée de l'Institut",
          amountCents: 66000,
          asso: {
            id: "asso-1",
            name: "AEEC Lille",
            memberships: [],
          },
        },
      ],
    });

    const preparation = await getConventionPreparation("campaign-1", "asso-1");

    expect(preparation?.data.period).toBe("2025-2026");
    expect(preparation?.data.expenses).toEqual([
      {
        grantedOn: "15/10/2025",
        description: "WEAC",
        amount: expect.stringContaining("650,00"),
      },
      {
        grantedOn: "15/10/2025",
        description: "Journée de l'Institut",
        amount: expect.stringContaining("660,00"),
      },
    ]);
    expect(preparation?.data.totalAmount).toContain("1 310,00");
    expect(preparation?.data.secondParty.address).toBe(
      preparation?.data.firstParty.address,
    );
    expect(preparation?.data.secondParty.representatives).toEqual([
      { name: "Yasmine SEMIANE", role: "Présidente" },
      { name: "", role: "Trésorier" },
    ]);
    expect(preparation?.data.firstPartySignature.date).toBe(
      preparation?.data.secondPartySignature.date,
    );
  });
});
