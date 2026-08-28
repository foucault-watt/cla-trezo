import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminMock,
  pdfFindUniqueMock,
  pdfUpdateMock,
  subventionFindUniqueOrThrowMock,
  subventionFindManyMock,
  financialMovementFindManyMock,
  revalidatePathMock,
  buildExpenseReportPdfPathMock,
  storedFileExistsMock,
  writeStoredFileMock,
  renderSubventionPdfMock,
  renderSoldePdfMock,
  getConventionPdfSettingsMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  pdfFindUniqueMock: vi.fn(),
  pdfUpdateMock: vi.fn(),
  subventionFindUniqueOrThrowMock: vi.fn(),
  subventionFindManyMock: vi.fn(),
  financialMovementFindManyMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  buildExpenseReportPdfPathMock: vi.fn(),
  storedFileExistsMock: vi.fn(),
  writeStoredFileMock: vi.fn(),
  renderSubventionPdfMock: vi.fn(),
  renderSoldePdfMock: vi.fn(),
  getConventionPdfSettingsMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseReportPdf: { findUnique: pdfFindUniqueMock, update: pdfUpdateMock },
    subvention: {
      findUniqueOrThrow: subventionFindUniqueOrThrowMock,
      findMany: subventionFindManyMock,
    },
    financialMovement: { findMany: financialMovementFindManyMock },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/storage/file-storage", () => ({
  buildExpenseReportPdfPath: buildExpenseReportPdfPathMock,
  storedFileExists: storedFileExistsMock,
  writeStoredFile: writeStoredFileMock,
}));
vi.mock("./render-expense-report-pdf", () => ({
  renderSubventionPdf: renderSubventionPdfMock,
  renderSoldePdf: renderSoldePdfMock,
}));
vi.mock("./convention-pdf-settings", () => ({
  getConventionPdfSettings: getConventionPdfSettingsMock,
}));

const { regenerateExpenseReportPdfAction } = await import(
  "./regenerate-expense-report-pdf"
);

const PDF_ID = "11111111-1111-4111-8111-111111111111";
const FINALIZED_AT = new Date("2026-02-20T09:00:00+01:00");

function soldeLine(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "line-solde",
    amountCents: 1500,
    expenseDate: new Date("2026-02-01T00:00:00+01:00"),
    expenseName: "Taxi",
    fundingSource: "CLUB_BALANCE",
    subventionId: null,
    ...overrides,
  };
}

function subventionLine(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "line-sub",
    amountCents: 3000,
    expenseDate: new Date("2026-02-05T00:00:00+01:00"),
    expenseName: "Matériel",
    fundingSource: "SUBVENTION",
    subventionId: "sub-1",
    ...overrides,
  };
}

function pdfRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: PDF_ID,
    filePath: "club-info/2025/report-1/old-uuid.pdf",
    fundingSource: "CLUB_BALANCE",
    subventionId: null,
    expenseReport: {
      id: "report-1",
      status: "FINALIZED",
      finalizedAt: FINALIZED_AT,
      assoId: "asso-1",
      beneficiaryFirstname: "Camille",
      beneficiaryLastname: "Martin",
      asso: { slug: "club-info", name: "Club Info" },
      lines: [soldeLine()],
    },
    ...overrides,
  };
}

function formData(pdfId: string = PDF_ID): FormData {
  const data = new FormData();
  data.set("pdfId", pdfId);
  return data;
}

beforeEach(() => {
  requireAdminMock.mockReset().mockResolvedValue({ id: "admin-1" });
  pdfFindUniqueMock.mockReset().mockResolvedValue(pdfRecord());
  pdfUpdateMock.mockReset().mockResolvedValue({});
  subventionFindUniqueOrThrowMock.mockReset().mockResolvedValue({
    reason: "Achat de matériel",
    campaignId: "campaign-1",
    campaign: { name: "Budget 2025-2026", publicationDate: new Date("2025-09-01") },
  });
  subventionFindManyMock.mockReset().mockResolvedValue([
    { reason: "Achat de matériel", amountCents: 10000 },
  ]);
  financialMovementFindManyMock.mockReset().mockResolvedValue([]);
  revalidatePathMock.mockReset();
  buildExpenseReportPdfPathMock
    .mockReset()
    .mockReturnValue("club-info/2026/report-1/new-uuid.pdf");
  storedFileExistsMock.mockReset().mockResolvedValue(false);
  writeStoredFileMock.mockReset().mockResolvedValue(undefined);
  renderSubventionPdfMock.mockReset().mockResolvedValue(Buffer.from("pdf-sub"));
  renderSoldePdfMock.mockReset().mockResolvedValue(Buffer.from("pdf-solde"));
  getConventionPdfSettingsMock
    .mockReset()
    .mockResolvedValue({ claTreasurerName: "Baptiste Frenay" });
});

describe("regenerateExpenseReportPdfAction", () => {
  it("reconstitue un PDF de Solde manquant et met à jour son filePath", async () => {
    const result = await regenerateExpenseReportPdfAction({ ok: false }, formData());

    expect(result).toEqual({ ok: true });
    expect(renderSoldePdfMock).toHaveBeenCalledTimes(1);
    expect(writeStoredFileMock).toHaveBeenCalledWith(
      "club-info/2026/report-1/new-uuid.pdf",
      Buffer.from("pdf-solde"),
    );
    expect(pdfUpdateMock).toHaveBeenCalledWith({
      where: { id: PDF_ID },
      data: { filePath: "club-info/2026/report-1/new-uuid.pdf" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/app/admin/notes-de-frais/report-1",
    );
  });

  it("utilise finalizedAt comme date du document, pas la date du jour", async () => {
    await regenerateExpenseReportPdfAction({ ok: false }, formData());

    const data = renderSoldePdfMock.mock.calls[0][0];
    expect(data.reportDate).toBe("20/02/2026");
  });

  it("marque le document comme une reconstitution et laisse l'IBAN vide", async () => {
    await regenerateExpenseReportPdfAction({ ok: false }, formData());

    const data = renderSoldePdfMock.mock.calls[0][0];
    expect(data.reconstitutionNote).toMatch(/reconstitué le/);
    expect(data.iban).toBeUndefined();
  });

  it("reconstitue un PDF de Subvention en excluant l'historique de cette Note elle-même et le postérieur", async () => {
    pdfFindUniqueMock.mockResolvedValue(
      pdfRecord({
        fundingSource: "SUBVENTION",
        subventionId: "sub-1",
        expenseReport: {
          ...pdfRecord().expenseReport,
          lines: [subventionLine()],
        },
      }),
    );

    const result = await regenerateExpenseReportPdfAction({ ok: false }, formData());

    expect(result).toEqual({ ok: true });
    expect(renderSubventionPdfMock).toHaveBeenCalledTimes(1);
    expect(financialMovementFindManyMock).toHaveBeenCalledWith({
      where: {
        accountType: "SUBVENTION",
        origin: "EXPENSE_REPORT",
        subventionId: "sub-1",
        createdAt: { lte: FINALIZED_AT },
        expenseReportLine: { expenseReportId: { not: "report-1" } },
      },
      select: expect.any(Object),
    });
  });

  it("refuse si la Note n'est pas encore validée", async () => {
    pdfFindUniqueMock.mockResolvedValue(
      pdfRecord({
        expenseReport: { ...pdfRecord().expenseReport, status: "TAKEN_OVER", finalizedAt: null },
      }),
    );

    const result = await regenerateExpenseReportPdfAction({ ok: false }, formData());

    expect(result.ok).toBe(false);
    expect(renderSoldePdfMock).not.toHaveBeenCalled();
    expect(writeStoredFileMock).not.toHaveBeenCalled();
  });

  it("refuse si le fichier existe encore sur le disque", async () => {
    storedFileExistsMock.mockResolvedValue(true);

    const result = await regenerateExpenseReportPdfAction({ ok: false }, formData());

    expect(result.ok).toBe(false);
    expect(renderSoldePdfMock).not.toHaveBeenCalled();
  });

  it("refuse si le PDF est introuvable", async () => {
    pdfFindUniqueMock.mockResolvedValue(null);

    const result = await regenerateExpenseReportPdfAction({ ok: false }, formData());

    expect(result.ok).toBe(false);
    expect(storedFileExistsMock).not.toHaveBeenCalled();
  });
});
