import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireStructureAccessMock,
  reportFindManyMock,
  reportFindUniqueMock,
  assoFindUniqueMock,
  typeDepenseFindManyMock,
  listVisibleSubventionsMock,
  notFoundMock,
} = vi.hoisted(() => ({
  requireStructureAccessMock: vi.fn(),
  reportFindManyMock: vi.fn(),
  reportFindUniqueMock: vi.fn(),
  assoFindUniqueMock: vi.fn(),
  typeDepenseFindManyMock: vi.fn(),
  listVisibleSubventionsMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireStructureAccess: requireStructureAccessMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseReport: {
      findMany: reportFindManyMock,
      findUnique: reportFindUniqueMock,
    },
    asso: { findUnique: assoFindUniqueMock },
    typeDepense: { findMany: typeDepenseFindManyMock },
  },
}));
vi.mock("@/lib/subventions/visible-subventions", () => ({
  listVisibleSubventions: listVisibleSubventionsMock,
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

const { listExpenseReports, getExpenseReportDetail } = await import(
  "./expense-reports"
);

beforeEach(() => {
  requireStructureAccessMock.mockReset();
  reportFindManyMock.mockReset();
  reportFindUniqueMock.mockReset();
  assoFindUniqueMock.mockReset();
  typeDepenseFindManyMock.mockReset();
  listVisibleSubventionsMock.mockReset();
  notFoundMock.mockClear();
  requireStructureAccessMock.mockResolvedValue({
    structure: { assoId: "asso-1", slug: "club-info", name: "Club Info" },
    user: { id: "user-1" },
  });
});

describe("listExpenseReports", () => {
  it("délègue le scoping par Structure à requireStructureAccess", async () => {
    reportFindManyMock.mockResolvedValue([]);

    await listExpenseReports("club-info");

    expect(requireStructureAccessMock).toHaveBeenCalledWith("club-info");
    expect(reportFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { assoId: "asso-1" } }),
    );
  });

  it("calcule le nombre de Lignes et le montant total à partir des Lignes", async () => {
    reportFindManyMock.mockResolvedValue([
      {
        id: "report-1",
        title: "Gala 2026",
        description: null,
        status: "DRAFT",
        createdAt: new Date("2026-01-01"),
        lines: [{ amountCents: 1000 }, { amountCents: 2500 }],
      },
    ]);

    const result = await listExpenseReports("club-info");

    expect(result).toEqual([
      {
        id: "report-1",
        title: "Gala 2026",
        description: null,
        status: "DRAFT",
        createdAt: new Date("2026-01-01"),
        linesCount: 2,
        totalAmountCents: 3500,
      },
    ]);
  });
});

describe("getExpenseReportDetail", () => {
  beforeEach(() => {
    assoFindUniqueMock.mockResolvedValue({ type: "CLUB" });
    typeDepenseFindManyMock.mockResolvedValue([]);
    listVisibleSubventionsMock.mockResolvedValue([]);
  });

  it("renvoie 404 si la Note de frais n'existe pas", async () => {
    reportFindUniqueMock.mockResolvedValue(null);

    await expect(
      getExpenseReportDetail("club-info", "report-1"),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("renvoie 404 si la Note de frais appartient à une autre Structure", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: "report-1",
      assoId: "asso-autre",
      title: "Gala 2026",
      description: null,
      status: "DRAFT",
      createdAt: new Date(),
      lines: [],
    });

    await expect(
      getExpenseReportDetail("club-info", "report-1"),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("renvoie le détail avec les libellés de Type de dépense et de Subvention", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: "report-1",
      assoId: "asso-1",
      title: "Gala 2026",
      description: "Déplacement en car",
      status: "DRAFT",
      createdAt: new Date("2026-01-01"),
      lines: [
        {
          id: "line-1",
          beneficiaryFirstname: "Jean",
          beneficiaryLastname: "Dupont",
          iban: "FR7630006000011234567890189",
          amountCents: 4250,
          typeDepenseId: "type-1",
          typeDepense: { label: "Transport" },
          customLabel: null,
          fundingSource: "SUBVENTION",
          subventionId: "sub-1",
          subvention: { reason: "Achat de matériel" },
        },
      ],
    });
    typeDepenseFindManyMock.mockResolvedValue([
      { id: "type-1", label: "Transport" },
    ]);

    const result = await getExpenseReportDetail("club-info", "report-1");

    expect(result.assoType).toBe("CLUB");
    expect(result.typeDepenses).toEqual([{ id: "type-1", label: "Transport" }]);
    expect(result.report.lines).toEqual([
      {
        id: "line-1",
        beneficiaryFirstname: "Jean",
        beneficiaryLastname: "Dupont",
        iban: "FR7630006000011234567890189",
        amountCents: 4250,
        typeDepenseId: "type-1",
        typeDepenseLabel: "Transport",
        customLabel: null,
        fundingSource: "SUBVENTION",
        subventionId: "sub-1",
        subventionReason: "Achat de matériel",
      },
    ]);
  });
});
