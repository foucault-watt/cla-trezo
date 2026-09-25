import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireStructureAccessMock,
  getClubSoldeMock,
  listExpenseReportsMock,
  listVisibleSubventionsMock,
  findManyMock,
} = vi.hoisted(() => ({
  requireStructureAccessMock: vi.fn(),
  getClubSoldeMock: vi.fn(),
  listExpenseReportsMock: vi.fn(),
  listVisibleSubventionsMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireStructureAccess: requireStructureAccessMock,
}));
vi.mock("@/lib/solde/actions", () => ({
  getClubSolde: getClubSoldeMock,
}));
vi.mock("@/lib/expense-reports/expense-reports", () => ({
  listExpenseReports: listExpenseReportsMock,
}));
vi.mock("@/lib/subventions/visible-subventions", () => ({
  listVisibleSubventions: listVisibleSubventionsMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { expenseReport: { findMany: findManyMock } },
}));

const { getDashboardOverview } = await import("./dashboard-overview");

const structure = {
  assoId: "asso-1",
  slug: "club-x",
  name: "Club X",
  role: "membre",
};

beforeEach(() => {
  requireStructureAccessMock.mockReset();
  getClubSoldeMock.mockReset();
  listExpenseReportsMock.mockReset();
  listVisibleSubventionsMock.mockReset();
  findManyMock.mockReset();

  requireStructureAccessMock.mockResolvedValue({
    structure,
    user: { id: "user-1" },
  });
  getClubSoldeMock.mockResolvedValue({ status: "not_applicable" });
  listExpenseReportsMock.mockResolvedValue([]);
  listVisibleSubventionsMock.mockResolvedValue([]);
  findManyMock.mockResolvedValue([]);
});

describe("getDashboardOverview", () => {
  it("regroupe les mouvements du Solde par année, année la plus récente en premier", async () => {
    getClubSoldeMock.mockResolvedValue({
      status: "ready",
      balanceCents: 1000,
      movements: [
        {
          id: "m1",
          movementType: "DEBIT",
          amountCents: 100,
          origin: "MANUAL",
          category: null,
          description: "A",
          createdAt: new Date("2026-03-01"),
        },
        {
          id: "m2",
          movementType: "CREDIT",
          amountCents: 200,
          origin: "MANUAL",
          category: null,
          description: "B",
          createdAt: new Date("2025-06-01"),
        },
        {
          id: "m3",
          movementType: "CREDIT",
          amountCents: 300,
          origin: "MANUAL",
          category: null,
          description: "C",
          createdAt: new Date("2024-01-01"),
        },
      ],
    });

    const result = await getDashboardOverview("club-x");

    expect(result.soldeMovementsByYear.map((g) => g.key)).toEqual([
      "2026",
      "2025",
      "2024",
    ]);
    expect(result.soldeMovementsByYear[0].items).toHaveLength(1);
  });

  it("compte comme en attente les Notes de frais Soumises ou Prises en charge, sans limite d'âge", async () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 3);
    listExpenseReportsMock.mockResolvedValue([
      {
        id: "r1",
        title: "",
        description: null,
        status: "SUBMITTED",
        createdAt: old,
        linesCount: 1,
        totalAmountCents: 500,
        beneficiaryFirstname: null,
        beneficiaryLastname: null,
      },
      {
        id: "r2",
        title: "",
        description: null,
        status: "FINALIZED",
        createdAt: new Date(),
        linesCount: 1,
        totalAmountCents: 700,
        beneficiaryFirstname: null,
        beneficiaryLastname: null,
      },
      {
        id: "r3",
        title: "",
        description: null,
        status: "DRAFT",
        createdAt: new Date(),
        linesCount: 1,
        totalAmountCents: 900,
        beneficiaryFirstname: null,
        beneficiaryLastname: null,
      },
    ]);

    const result = await getDashboardOverview("club-x");

    expect(result.notesDeFrais.enAttente).toBe(1);
  });

  it("ne compte le total et le montant des Notes de frais que sur les 365 derniers jours", async () => {
    const recent = new Date();
    const old = new Date();
    old.setDate(old.getDate() - 400);
    listExpenseReportsMock.mockResolvedValue([
      {
        id: "r1",
        title: "",
        description: null,
        status: "FINALIZED",
        createdAt: recent,
        linesCount: 1,
        totalAmountCents: 500,
        beneficiaryFirstname: null,
        beneficiaryLastname: null,
      },
      {
        id: "r2",
        title: "",
        description: null,
        status: "FINALIZED",
        createdAt: old,
        linesCount: 1,
        totalAmountCents: 999999,
        beneficiaryFirstname: null,
        beneficiaryLastname: null,
      },
    ]);

    const result = await getDashboardOverview("club-x");

    expect(result.notesDeFrais.totalLast365Days).toBe(1);
    expect(result.notesDeFrais.montantTotalLast365DaysCents).toBe(500);
  });

  it("ne compte les Subventions que sur les 365 derniers jours, en dédupliquant par Campagne", async () => {
    const recentDate = new Date();
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 400);
    listVisibleSubventionsMock.mockResolvedValue([
      {
        id: "s1",
        campaignId: "camp-1",
        campaignName: "Récente",
        type: "CA_BUDGET",
        reason: "",
        totalAmountCents: 1000,
        usedAmountCents: 200,
        remainingAmountCents: 800,
        commentary: null,
        publicationDate: recentDate,
        stale: false,
      },
      {
        id: "s2",
        campaignId: "camp-1",
        campaignName: "Récente",
        type: "CA_BUDGET",
        reason: "",
        totalAmountCents: 1000,
        usedAmountCents: 0,
        remainingAmountCents: 1000,
        commentary: null,
        publicationDate: recentDate,
        stale: false,
      },
      {
        id: "s3",
        campaignId: "camp-2",
        campaignName: "Ancienne",
        type: "CA_BUDGET",
        reason: "",
        totalAmountCents: 5000,
        usedAmountCents: 0,
        remainingAmountCents: 5000,
        commentary: null,
        publicationDate: oldDate,
        stale: true,
      },
    ]);

    const result = await getDashboardOverview("club-x");

    expect(result.subventions.activesLast365Days).toBe(1);
    expect(result.subventions.montantRestantLast365DaysCents).toBe(1800);
    expect(result.subventions.montantTotalLast365DaysCents).toBe(2000);
  });

  it("fusionne Notes de frais et Subventions en une activité triée par date, la plus récente en premier", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "r1",
        submittedAt: new Date("2025-05-01"),
        finalizedAt: new Date("2025-06-01"),
        beneficiaryFirstname: "Julie",
        beneficiaryLastname: "Marchand",
        lines: [{ amountCents: 12500 }],
      },
    ]);
    listVisibleSubventionsMock.mockResolvedValue([
      {
        id: "s1",
        campaignId: "camp-1",
        campaignName: "CA Budget",
        type: "CA_BUDGET",
        reason: "",
        totalAmountCents: 1000,
        usedAmountCents: 0,
        remainingAmountCents: 1000,
        commentary: null,
        publicationDate: new Date("2025-07-01"),
        stale: false,
      },
    ]);

    const result = await getDashboardOverview("club-x");

    const allEvents = result.recentActivityByYear.flatMap((g) => g.items);
    expect(allEvents.map((e) => e.label)).toEqual([
      "Subvention publiée",
      "Note de frais validée",
      "Note de frais soumise",
    ]);
  });
});
