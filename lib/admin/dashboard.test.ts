import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  assoCountMock,
  subventionFindManyMock,
  financialMovementFindManyMock,
  expenseReportCountMock,
  expenseReportFindManyMock,
  subventionCampaignFindManyMock,
} = vi.hoisted(() => ({
  assoCountMock: vi.fn(),
  subventionFindManyMock: vi.fn(),
  financialMovementFindManyMock: vi.fn(),
  expenseReportCountMock: vi.fn(),
  expenseReportFindManyMock: vi.fn(),
  subventionCampaignFindManyMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    asso: { count: assoCountMock },
    subvention: { findMany: subventionFindManyMock },
    financialMovement: { findMany: financialMovementFindManyMock },
    expenseReport: { count: expenseReportCountMock, findMany: expenseReportFindManyMock },
    subventionCampaign: { findMany: subventionCampaignFindManyMock },
  },
}));

const {
  rollingWindow,
  sumInWindow,
  selectCampaignInfo,
  daysSince,
  buildActivityFeed,
  getDashboardData,
} = await import("./dashboard");

const NOW = new Date("2026-08-19T12:00:00Z");

beforeEach(() => {
  assoCountMock.mockReset();
  subventionFindManyMock.mockReset();
  financialMovementFindManyMock.mockReset();
  expenseReportCountMock.mockReset();
  expenseReportFindManyMock.mockReset();
  subventionCampaignFindManyMock.mockReset();
});

describe("rollingWindow", () => {
  it("place currentStart 365 jours avant now, et previousStart 365 jours avant currentStart", () => {
    const window = rollingWindow(NOW);

    expect(window.currentStart).toEqual(new Date("2025-08-19T12:00:00Z"));
    expect(window.previousStart).toEqual(new Date("2024-08-19T12:00:00Z"));
  });
});

describe("sumInWindow", () => {
  const window = rollingWindow(NOW);

  it("répartit les montants entre période courante et précédente", () => {
    const result = sumInWindow(
      [
        { amountCents: 100, createdAt: new Date("2026-08-01T00:00:00Z") }, // courante
        { amountCents: 50, createdAt: new Date("2025-01-01T00:00:00Z") }, // précédente
        { amountCents: 999, createdAt: new Date("2023-01-01T00:00:00Z") }, // hors fenêtre
      ],
      window,
    );

    expect(result).toEqual({ current: 100, previous: 50 });
  });

  it("renvoie des sommes à zéro pour une liste vide", () => {
    expect(sumInWindow([], window)).toEqual({ current: 0, previous: 0 });
  });
});

describe("daysSince", () => {
  it("compte le nombre de jours entiers écoulés", () => {
    expect(daysSince(new Date("2026-08-12T12:00:00Z"), NOW)).toBe(7);
  });
});

describe("selectCampaignInfo", () => {
  it("choisit la Campagne Programmée dont la publication est la plus proche", () => {
    const result = selectCampaignInfo(
      [
        { name: "Loin", publicationDate: new Date("2026-12-01") },
        { name: "Proche", publicationDate: new Date("2026-09-01") },
      ],
      NOW,
    );

    expect(result).toEqual({
      kind: "pending",
      name: "Proche",
      publicationDate: new Date("2026-09-01"),
    });
  });

  it("choisit une Campagne Programmée sans date si aucune autre n'en a", () => {
    const result = selectCampaignInfo(
      [{ name: "Sans date", publicationDate: null }],
      NOW,
    );

    expect(result).toEqual({
      kind: "pending",
      name: "Sans date",
      publicationDate: null,
    });
  });

  it("retombe sur la dernière Campagne Publiée s'il n'y en a aucune Programmée", () => {
    const result = selectCampaignInfo(
      [
        { name: "Ancienne", publicationDate: new Date("2025-01-01") },
        { name: "Récente", publicationDate: new Date("2026-01-01") },
      ],
      NOW,
    );

    expect(result).toEqual({
      kind: "published",
      name: "Récente",
      publicationDate: new Date("2026-01-01"),
    });
  });

  it("renvoie null s'il n'existe aucune Campagne", () => {
    expect(selectCampaignInfo([], NOW)).toBeNull();
  });
});

describe("buildActivityFeed", () => {
  it("trie par date décroissante et tronque à la limite", () => {
    const result = buildActivityFeed(
      [
        { id: "a", type: "mouvement", assoName: "A", label: "", date: new Date("2026-01-01") },
        { id: "b", type: "mouvement", assoName: "B", label: "", date: new Date("2026-03-01") },
        { id: "c", type: "mouvement", assoName: "C", label: "", date: new Date("2026-02-01") },
      ],
      2,
    );

    expect(result.map((e) => e.id)).toEqual(["b", "c"]);
  });
});

describe("getDashboardData", () => {
  it("assemble les données depuis les requêtes Prisma", async () => {
    assoCountMock.mockResolvedValue(12);
    subventionFindManyMock
      .mockResolvedValueOnce([{ amountCents: 500, createdAt: NOW }]) // fenêtre 365j
      .mockResolvedValueOnce([
        { id: "s1", createdAt: NOW, reason: "Événement", amountCents: 500, asso: { name: "Club Photo" } },
      ]); // activité récente
    financialMovementFindManyMock
      .mockResolvedValueOnce([{ amountCents: 200, createdAt: NOW }]) // fenêtre 365j
      .mockResolvedValueOnce([
        {
          id: "m1",
          createdAt: NOW,
          movementType: "CREDIT",
          amountCents: 300,
          asso: { name: "Club Robotique" },
        },
      ]); // mouvements manuels
    expenseReportCountMock.mockResolvedValue(3);
    expenseReportFindManyMock
      .mockResolvedValueOnce([
        {
          id: "r1",
          title: "Weekend photo",
          createdAt: NOW,
          submittedAt: NOW,
          asso: { name: "Club Photo" },
          lines: [{ amountCents: 1000 }],
        },
      ]) // file d'attente
      .mockResolvedValueOnce([]) // notes finalisées
      .mockResolvedValueOnce([]); // notes soumises (activité)
    subventionCampaignFindManyMock.mockResolvedValue([
      { name: "CA Budget", publicationDate: new Date("2026-09-01") },
    ]);

    const result = await getDashboardData(NOW);

    expect(result.assosActives).toBe(12);
    expect(result.subventionsAccordeesCents365j).toBe(500);
    expect(result.montantRembourseCents365j).toBe(200);
    expect(result.notesTraiteesCeMois).toBe(3);
    expect(result.queue).toEqual([
      {
        id: "r1",
        assoName: "Club Photo",
        title: "Weekend photo",
        amountCents: 1000,
        daysWaiting: 0,
      },
    ]);
    expect(result.campaignInfo).toEqual({
      kind: "pending",
      name: "CA Budget",
      publicationDate: new Date("2026-09-01"),
    });
    expect(result.recentActivity.map((e) => e.id)).toEqual(
      expect.arrayContaining(["subvention-s1", "movement-m1"]),
    );
  });
});
