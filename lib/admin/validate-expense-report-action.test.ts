import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixture as ndfFnSbFixture } from "@/pdf-lab/templates/ndf-fn-sb/fixture";
import { fixture as ndfSoldeFixture } from "@/pdf-lab/templates/ndf-solde/fixture";

const {
  requireAdminMock,
  reportFindUniqueMock,
  transactionMock,
  txReportFindUniqueMock,
  txFinancialMovementCreateManyMock,
  txExpenseReportPdfCreateManyMock,
  txExpenseReportUpdateMock,
  revalidatePathMock,
  buildExpenseReportPdfPathMock,
  writeStoredFileMock,
  deleteStoredFileMock,
  renderSubventionPdfMock,
  renderSoldePdfMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  reportFindUniqueMock: vi.fn(),
  transactionMock: vi.fn(),
  txReportFindUniqueMock: vi.fn(),
  txFinancialMovementCreateManyMock: vi.fn(),
  txExpenseReportPdfCreateManyMock: vi.fn(),
  txExpenseReportUpdateMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  buildExpenseReportPdfPathMock: vi.fn(),
  writeStoredFileMock: vi.fn(),
  deleteStoredFileMock: vi.fn(),
  renderSubventionPdfMock: vi.fn(),
  renderSoldePdfMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseReport: { findUnique: reportFindUniqueMock },
    $transaction: transactionMock,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/storage/file-storage", () => ({
  buildExpenseReportPdfPath: buildExpenseReportPdfPathMock,
  writeStoredFile: writeStoredFileMock,
  deleteStoredFile: deleteStoredFileMock,
}));
vi.mock("./render-expense-report-pdf", () => ({
  renderSubventionPdf: renderSubventionPdfMock,
  renderSoldePdf: renderSoldePdfMock,
}));

const { validateExpenseReportAction } = await import(
  "./validate-expense-report-action"
);

const admin = { id: "admin-1", isAdmin: true };

const soldeLine = {
  id: "line-solde",
  amountCents: 3000,
  fundingSource: "CLUB_BALANCE",
  subventionId: null,
};
const subALine = {
  id: "line-sub-a",
  amountCents: 1000,
  fundingSource: "SUBVENTION",
  subventionId: "sub-a",
};
const subBLine = {
  id: "line-sub-b",
  amountCents: 2000,
  fundingSource: "SUBVENTION",
  subventionId: "sub-b",
};

function report(overrides: Partial<{ status: string; lines: unknown[] }> = {}) {
  return {
    id: "report-1",
    assoId: "asso-1",
    status: "TAKEN_OVER",
    asso: { slug: "club-info" },
    lines: [soldeLine],
    ...overrides,
  };
}

beforeEach(() => {
  requireAdminMock.mockReset().mockResolvedValue(admin);
  reportFindUniqueMock.mockReset().mockResolvedValue(report());
  revalidatePathMock.mockReset();
  renderSubventionPdfMock.mockReset().mockResolvedValue(Buffer.from("pdf-sub"));
  renderSoldePdfMock.mockReset().mockResolvedValue(Buffer.from("pdf-solde"));
  writeStoredFileMock.mockReset().mockResolvedValue(undefined);
  deleteStoredFileMock.mockReset().mockResolvedValue(undefined);

  let counter = 0;
  buildExpenseReportPdfPathMock
    .mockReset()
    .mockImplementation(() => `club-info/report-1/pdf-${counter++}.pdf`);

  txReportFindUniqueMock.mockReset().mockResolvedValue({ status: "TAKEN_OVER" });
  txFinancialMovementCreateManyMock.mockReset().mockResolvedValue({ count: 1 });
  txExpenseReportPdfCreateManyMock.mockReset().mockResolvedValue({ count: 1 });
  txExpenseReportUpdateMock.mockReset().mockResolvedValue({});
  transactionMock.mockReset().mockImplementation(async (callback) =>
    callback({
      expenseReport: {
        findUnique: txReportFindUniqueMock,
        update: txExpenseReportUpdateMock,
      },
      financialMovement: { createMany: txFinancialMovementCreateManyMock },
      expenseReportPdf: { createMany: txExpenseReportPdfCreateManyMock },
    }),
  );
});

describe("validateExpenseReportAction", () => {
  it("valide une Note financée uniquement par le Solde : un seul PDF, un seul mouvement", async () => {
    const result = await validateExpenseReportAction("report-1", [
      { kind: "CLUB_BALANCE", data: ndfSoldeFixture },
    ]);

    expect(result).toEqual({ ok: true });
    expect(renderSoldePdfMock).toHaveBeenCalledTimes(1);
    expect(renderSubventionPdfMock).not.toHaveBeenCalled();
    expect(writeStoredFileMock).toHaveBeenCalledTimes(1);
    expect(txFinancialMovementCreateManyMock).toHaveBeenCalledWith({
      data: [
        {
          assoId: "asso-1",
          movementType: "DEBIT",
          accountType: "CLUB_BALANCE",
          origin: "EXPENSE_REPORT",
          amountCents: 3000,
          subventionId: null,
          expenseReportLineId: "line-solde",
          createdBy: "admin-1",
        },
      ],
    });
    expect(txExpenseReportPdfCreateManyMock).toHaveBeenCalledWith({
      data: [
        {
          expenseReportId: "report-1",
          fundingSource: "CLUB_BALANCE",
          subventionId: null,
          filePath: "club-info/report-1/pdf-0.pdf",
        },
      ],
    });
    expect(txExpenseReportUpdateMock).toHaveBeenCalledWith({
      where: { id: "report-1" },
      data: expect.objectContaining({
        status: "FINALIZED",
        beneficiaryIban: null,
      }),
    });
  });

  it("valide une Note financée par une seule Subvention : un seul PDF", async () => {
    reportFindUniqueMock.mockResolvedValue(report({ lines: [subALine] }));

    const result = await validateExpenseReportAction("report-1", [
      { kind: "SUBVENTION", subventionId: "sub-a", data: ndfFnSbFixture },
    ]);

    expect(result).toEqual({ ok: true });
    expect(renderSubventionPdfMock).toHaveBeenCalledTimes(1);
    expect(renderSoldePdfMock).not.toHaveBeenCalled();
    expect(txFinancialMovementCreateManyMock).toHaveBeenCalledWith({
      data: [
        {
          assoId: "asso-1",
          movementType: "DEBIT",
          accountType: "SUBVENTION",
          origin: "EXPENSE_REPORT",
          amountCents: 1000,
          subventionId: "sub-a",
          expenseReportLineId: "line-sub-a",
          createdBy: "admin-1",
        },
      ],
    });
  });

  it("valide une Note Solde + plusieurs Subventions : un PDF par source, un mouvement par Ligne", async () => {
    reportFindUniqueMock.mockResolvedValue(
      report({ lines: [soldeLine, subALine, subBLine] }),
    );

    const result = await validateExpenseReportAction("report-1", [
      { kind: "CLUB_BALANCE", data: ndfSoldeFixture },
      { kind: "SUBVENTION", subventionId: "sub-a", data: ndfFnSbFixture },
      { kind: "SUBVENTION", subventionId: "sub-b", data: ndfFnSbFixture },
    ]);

    expect(result).toEqual({ ok: true });
    expect(writeStoredFileMock).toHaveBeenCalledTimes(3);
    expect(txFinancialMovementCreateManyMock).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ expenseReportLineId: "line-solde" }),
        expect.objectContaining({ expenseReportLineId: "line-sub-a" }),
        expect.objectContaining({ expenseReportLineId: "line-sub-b" }),
      ]),
    });
    expect(
      (txFinancialMovementCreateManyMock.mock.calls[0][0] as { data: unknown[] })
        .data,
    ).toHaveLength(3);
  });

  it("rejette une Note qui n'est pas Prise en charge", async () => {
    reportFindUniqueMock.mockResolvedValue(report({ status: "SUBMITTED" }));

    const result = await validateExpenseReportAction("report-1", [
      { kind: "CLUB_BALANCE", data: ndfSoldeFixture },
    ]);

    expect(result.ok).toBe(false);
    expect(renderSoldePdfMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("rejette si les documents envoyés ne correspondent pas aux Lignes réelles", async () => {
    reportFindUniqueMock.mockResolvedValue(
      report({ lines: [soldeLine, subALine] }),
    );

    const result = await validateExpenseReportAction("report-1", [
      { kind: "CLUB_BALANCE", data: ndfSoldeFixture },
    ]);

    expect(result.ok).toBe(false);
    expect(renderSoldePdfMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("supprime les fichiers déjà écrits si le rendu d'un PDF échoue", async () => {
    reportFindUniqueMock.mockResolvedValue(
      report({ lines: [soldeLine, subALine] }),
    );
    renderSubventionPdfMock.mockRejectedValue(new Error("rendu cassé"));

    const result = await validateExpenseReportAction("report-1", [
      { kind: "CLUB_BALANCE", data: ndfSoldeFixture },
      { kind: "SUBVENTION", subventionId: "sub-a", data: ndfFnSbFixture },
    ]);

    expect(result.ok).toBe(false);
    expect(writeStoredFileMock).toHaveBeenCalledTimes(1);
    expect(deleteStoredFileMock).toHaveBeenCalledWith(
      "club-info/report-1/pdf-0.pdf",
    );
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("supprime les fichiers écrits si la transaction échoue", async () => {
    transactionMock.mockRejectedValue(new Error("transaction cassée"));

    const result = await validateExpenseReportAction("report-1", [
      { kind: "CLUB_BALANCE", data: ndfSoldeFixture },
    ]);

    expect(result.ok).toBe(false);
    expect(deleteStoredFileMock).toHaveBeenCalledWith(
      "club-info/report-1/pdf-0.pdf",
    );
  });

  it("échoue proprement si le statut a changé entre-temps (course concurrente)", async () => {
    txReportFindUniqueMock.mockResolvedValue({ status: "FINALIZED" });

    const result = await validateExpenseReportAction("report-1", [
      { kind: "CLUB_BALANCE", data: ndfSoldeFixture },
    ]);

    expect(result.ok).toBe(false);
    expect(deleteStoredFileMock).toHaveBeenCalledWith(
      "club-info/report-1/pdf-0.pdf",
    );
    expect(txExpenseReportUpdateMock).not.toHaveBeenCalled();
  });
});
