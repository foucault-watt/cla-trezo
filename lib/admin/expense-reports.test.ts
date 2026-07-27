import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireAdminMock, reportFindManyMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  reportFindManyMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { expenseReport: { findMany: reportFindManyMock } },
}));

const { listExpenseReportsForAdmin } = await import("./expense-reports");

beforeEach(() => {
  requireAdminMock.mockReset();
  reportFindManyMock.mockReset();
  requireAdminMock.mockResolvedValue({ id: "admin-1", isAdmin: true });
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
