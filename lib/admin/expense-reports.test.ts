import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireAdminMock,
  reportFindManyMock,
  reportFindUniqueMock,
  typeDepenseFindManyMock,
  listVisibleSubventionsForAdminMock,
  getClubSoldeForAdminMock,
  lineFindManyMock,
  subventionFindUniqueMock,
  financialMovementFindManyMock,
  notFoundMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  reportFindManyMock: vi.fn(),
  reportFindUniqueMock: vi.fn(),
  typeDepenseFindManyMock: vi.fn(),
  listVisibleSubventionsForAdminMock: vi.fn(),
  getClubSoldeForAdminMock: vi.fn(),
  lineFindManyMock: vi.fn(),
  subventionFindUniqueMock: vi.fn(),
  financialMovementFindManyMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseReport: { findMany: reportFindManyMock, findUnique: reportFindUniqueMock },
    expenseReportLine: { findMany: lineFindManyMock },
    subvention: { findUnique: subventionFindUniqueMock },
    financialMovement: { findMany: financialMovementFindManyMock },
    typeDepense: { findMany: typeDepenseFindManyMock },
  },
}));
vi.mock("@/lib/subventions/visible-subventions", () => ({
  listVisibleSubventionsForAdmin: listVisibleSubventionsForAdminMock,
}));
vi.mock("@/lib/solde/actions", () => ({
  getClubSoldeForAdmin: getClubSoldeForAdminMock,
}));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

const { listExpenseReportsForAdmin, getExpenseReportDetailForAdmin } =
  await import("./expense-reports");

beforeEach(() => {
  requireAdminMock.mockReset();
  reportFindManyMock.mockReset();
  reportFindUniqueMock.mockReset();
  typeDepenseFindManyMock.mockReset();
  listVisibleSubventionsForAdminMock.mockReset();
  getClubSoldeForAdminMock.mockReset();
  lineFindManyMock.mockReset();
  subventionFindUniqueMock.mockReset();
  financialMovementFindManyMock.mockReset();
  notFoundMock.mockClear();
  requireAdminMock.mockResolvedValue({ id: "admin-1", isAdmin: true });
  lineFindManyMock.mockResolvedValue([]);
  subventionFindUniqueMock.mockResolvedValue(null);
  financialMovementFindManyMock.mockResolvedValue([]);
  typeDepenseFindManyMock.mockResolvedValue([]);
  listVisibleSubventionsForAdminMock.mockResolvedValue([]);
  getClubSoldeForAdminMock.mockResolvedValue({ status: "not_applicable" });
});

describe("listExpenseReportsForAdmin", () => {
  it("exige un Admin", async () => {
    reportFindManyMock.mockResolvedValue([]);

    await listExpenseReportsForAdmin();

    expect(requireAdminMock).toHaveBeenCalled();
  });

  it("ne récupère que les Notes Soumises ou Prises en charge, toutes Structures confondues", async () => {
    reportFindManyMock.mockResolvedValue([]);

    await listExpenseReportsForAdmin();

    expect(reportFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ["SUBMITTED", "TAKEN_OVER"] } },
      }),
    );
  });

  it("agrège le nombre de Lignes et le montant total par note, avec le nom de la Structure", async () => {
    reportFindManyMock.mockResolvedValue([
      {
        id: "report-1",
        title: "Gala 2026",
        status: "SUBMITTED",
        createdAt: new Date("2026-01-01"),
        asso: { name: "Club Info" },
        lines: [{ amountCents: 1000 }, { amountCents: 2500 }],
      },
      {
        id: "report-2",
        title: "Weekend d'intégration",
        status: "TAKEN_OVER",
        createdAt: new Date("2026-01-02"),
        asso: { name: "Commission Culture" },
        lines: [],
      },
    ]);

    const result = await listExpenseReportsForAdmin();

    expect(result).toEqual([
      {
        id: "report-1",
        title: "Gala 2026",
        status: "SUBMITTED",
        createdAt: new Date("2026-01-01"),
        assoName: "Club Info",
        linesCount: 2,
        totalAmountCents: 3500,
      },
      {
        id: "report-2",
        title: "Weekend d'intégration",
        status: "TAKEN_OVER",
        createdAt: new Date("2026-01-02"),
        assoName: "Commission Culture",
        linesCount: 0,
        totalAmountCents: 0,
      },
    ]);
  });
});

describe("getExpenseReportDetailForAdmin", () => {
  const baseReport = {
    id: "report-1",
    assoId: "asso-1",
    title: "Gala 2026",
    description: "Déplacement en car",
    status: "TAKEN_OVER",
    createdAt: new Date("2026-01-01"),
    asso: { name: "Club Info", slug: "club-info", type: "CLUB" },
    lines: [],
    supportingDocuments: [],
  };

  it("renvoie 404 si la Note de frais n'existe pas", async () => {
    reportFindUniqueMock.mockResolvedValue(null);

    await expect(
      getExpenseReportDetailForAdmin("report-1"),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("charge le type de la Structure, les Types de dépense et les Subventions visibles, scopés par l'assoId de la Note (#18)", async () => {
    reportFindUniqueMock.mockResolvedValue(baseReport);
    typeDepenseFindManyMock.mockResolvedValue([
      { id: "type-1", label: "Transport" },
    ]);
    listVisibleSubventionsForAdminMock.mockResolvedValue([
      { id: "sub-1", reason: "Achat de matériel" },
    ]);
    getClubSoldeForAdminMock.mockResolvedValue({
      status: "ready",
      balanceCents: 5000,
      movements: [],
    });

    const result = await getExpenseReportDetailForAdmin("report-1");

    expect(requireAdminMock).toHaveBeenCalled();
    expect(listVisibleSubventionsForAdminMock).toHaveBeenCalledWith("asso-1");
    expect(getClubSoldeForAdminMock).toHaveBeenCalledWith("asso-1");
    expect(result.assoType).toBe("CLUB");
    expect(result.typeDepenses).toEqual([{ id: "type-1", label: "Transport" }]);
    expect(result.visibleSubventions).toEqual([
      { id: "sub-1", reason: "Achat de matériel" },
    ]);
    expect(result.soldeView).toEqual({
      status: "ready",
      balanceCents: 5000,
      movements: [],
    });
  });
});
