import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireStructureAccessMock,
  reportFindManyMock,
  reportFindUniqueMock,
  assoFindUniqueMock,
  typeDepenseFindManyMock,
  listVisibleSubventionsMock,
  lineFindManyMock,
  subventionFindUniqueMock,
  financialMovementFindManyMock,
  notFoundMock,
} = vi.hoisted(() => ({
  requireStructureAccessMock: vi.fn(),
  reportFindManyMock: vi.fn(),
  reportFindUniqueMock: vi.fn(),
  assoFindUniqueMock: vi.fn(),
  typeDepenseFindManyMock: vi.fn(),
  listVisibleSubventionsMock: vi.fn(),
  lineFindManyMock: vi.fn(),
  subventionFindUniqueMock: vi.fn(),
  financialMovementFindManyMock: vi.fn(),
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
    expenseReportLine: { findMany: lineFindManyMock },
    subvention: { findUnique: subventionFindUniqueMock },
    financialMovement: { findMany: financialMovementFindManyMock },
    asso: { findUnique: assoFindUniqueMock },
    typeDepense: { findMany: typeDepenseFindManyMock },
  },
}));
vi.mock("@/lib/subventions/visible-subventions", () => ({
  listVisibleSubventions: listVisibleSubventionsMock,
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

const { listExpenseReports, getExpenseReportDetail } =
  await import("./expense-reports");

beforeEach(() => {
  requireStructureAccessMock.mockReset();
  reportFindManyMock.mockReset();
  reportFindUniqueMock.mockReset();
  assoFindUniqueMock.mockReset();
  typeDepenseFindManyMock.mockReset();
  listVisibleSubventionsMock.mockReset();
  lineFindManyMock.mockReset();
  subventionFindUniqueMock.mockReset();
  financialMovementFindManyMock.mockReset();
  notFoundMock.mockClear();
  requireStructureAccessMock.mockResolvedValue({
    structure: { assoId: "asso-1", slug: "club-info", name: "Club Info" },
    user: { id: "user-1" },
  });
  lineFindManyMock.mockResolvedValue([]);
  subventionFindUniqueMock.mockResolvedValue(null);
  financialMovementFindManyMock.mockResolvedValue([]);
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
          expenseName: "Billets de train",
          typeDepenseId: "type-1",
          typeDepense: { label: "Transport" },
          customLabel: null,
          fundingSource: "SUBVENTION",
          subventionId: "sub-1",
          subvention: { reason: "Achat de matériel" },
        },
      ],
      supportingDocuments: [
        {
          id: "doc-1",
          type: "RECEIPT",
          originalFilename: "facture.pdf",
          mimeType: "application/pdf",
          createdAt: new Date("2026-01-02"),
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
        iban: null,
        amountCents: 4250,
        expenseName: "Billets de train",
        typeDepenseId: "type-1",
        typeDepenseLabel: "Transport",
        customLabel: null,
        fundingSource: "SUBVENTION",
        subventionId: "sub-1",
        subventionReason: "Achat de matériel",
        warnings: [],
      },
    ]);
    expect(result.report.supportingDocuments).toEqual([
      {
        id: "doc-1",
        type: "RECEIPT",
        originalFilename: "facture.pdf",
        mimeType: "application/pdf",
        createdAt: new Date("2026-01-02"),
      },
    ]);
  });

  it("exclut du panneau de sélection les Subventions dont la Campagne date de plus de deux ans", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: "report-1",
      assoId: "asso-1",
      title: "Gala 2026",
      description: null,
      status: "DRAFT",
      createdAt: new Date("2026-01-01"),
      lines: [],
      supportingDocuments: [],
    });
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    listVisibleSubventionsMock.mockResolvedValue([
      {
        id: "sub-old",
        campaignName: "Vieille campagne",
        type: "CA_BUDGET",
        reason: "Achat de matériel",
        totalAmountCents: 1000,
        usedAmountCents: 0,
        remainingAmountCents: 1000,
        commentary: null,
        publicationDate: threeYearsAgo,
        campaignDate: threeYearsAgo,
        stale: true,
      },
      {
        id: "sub-recent",
        campaignName: "Campagne récente",
        type: "CA_BUDGET",
        reason: "Location de salle",
        totalAmountCents: 2000,
        usedAmountCents: 0,
        remainingAmountCents: 2000,
        commentary: null,
        publicationDate: sixMonthsAgo,
        campaignDate: sixMonthsAgo,
        stale: false,
      },
    ]);

    const result = await getExpenseReportDetail("club-info", "report-1");

    expect(result.visibleSubventions.map((s) => s.id)).toEqual([
      "sub-recent",
    ]);
  });

  it("ne renvoie jamais l'IBAN à la Structure, même si la Ligne en a un en base", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: "report-1",
      assoId: "asso-1",
      title: "Gala 2026",
      description: null,
      status: "DRAFT",
      createdAt: new Date("2026-01-01"),
      lines: [
        {
          id: "line-1",
          beneficiaryFirstname: "Jean",
          beneficiaryLastname: "Dupont",
          iban: "FR7630006000011234567890189",
          amountCents: 4250,
          expenseName: "Billets de train",
          typeDepenseId: null,
          typeDepense: null,
          customLabel: "Frais divers",
          fundingSource: "SOLDE",
          subventionId: null,
          subvention: null,
        },
      ],
      supportingDocuments: [],
    });

    const result = await getExpenseReportDetail("club-info", "report-1");

    expect(result.report.lines[0]?.iban).toBeNull();
  });
});
