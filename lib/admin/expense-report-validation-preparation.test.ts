import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminMock,
  notFoundMock,
  reportFindUniqueMock,
  subventionFindUniqueOrThrowMock,
  subventionFindManyMock,
  financialMovementFindManyMock,
  getConventionPdfSettingsMock,
  buildSoldePdfDataMock,
  buildSubventionPdfDataMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  reportFindUniqueMock: vi.fn(),
  subventionFindUniqueOrThrowMock: vi.fn(),
  subventionFindManyMock: vi.fn(),
  financialMovementFindManyMock: vi.fn(),
  getConventionPdfSettingsMock: vi.fn(),
  buildSoldePdfDataMock: vi.fn((input) => ({ builtBy: "solde", input })),
  buildSubventionPdfDataMock: vi.fn((input) => ({ builtBy: "subvention", input })),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseReport: { findUnique: reportFindUniqueMock },
    subvention: {
      findUniqueOrThrow: subventionFindUniqueOrThrowMock,
      findMany: subventionFindManyMock,
    },
    financialMovement: { findMany: financialMovementFindManyMock },
  },
}));
vi.mock("./convention-pdf-settings", () => ({
  getConventionPdfSettings: getConventionPdfSettingsMock,
}));
vi.mock("./expense-report-pdf-data", () => ({
  buildSoldePdfData: buildSoldePdfDataMock,
  buildSubventionPdfData: buildSubventionPdfDataMock,
}));

const { prepareExpenseReportValidation } = await import(
  "./expense-report-validation-preparation"
);

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const line = (
  id: string,
  fundingSource: "CLUB_BALANCE" | "SUBVENTION",
  subventionId: string | null,
  amountCents: number,
) => ({
  id,
  amountCents,
  expenseDate: day("2026-09-01"),
  expenseName: `Dépense ${id}`,
  fundingSource,
  subventionId,
});

const report = {
  id: "report-1",
  status: "TAKEN_IN_CHARGE",
  assoId: "asso-1",
  beneficiaryFirstname: "Jean",
  beneficiaryLastname: "Dupont",
  beneficiaryIban: "FR7630006000011234567890189",
  asso: { slug: "club-info", name: "Club Info" },
  lines: [
    line("l1", "SUBVENTION", "sub-A", 1000),
    line("l2", "CLUB_BALANCE", null, 500),
    line("l3", "SUBVENTION", "sub-A", 2000),
    line("l4", "SUBVENTION", "sub-B", 300),
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  reportFindUniqueMock.mockResolvedValue(report);
  getConventionPdfSettingsMock.mockResolvedValue({
    claTreasurerName: "Marie Trésorière",
  });
  subventionFindUniqueOrThrowMock.mockImplementation(async ({ where }) => ({
    reason: `Motif ${where.id}`,
    campaignId: `campaign-of-${where.id}`,
    campaign: {
      name: `Campagne ${where.id}`,
      publicationDate: day("2026-02-01"),
    },
  }));
  subventionFindManyMock.mockResolvedValue([
    { reason: "Motif sub-A", amountCents: 10000 },
  ]);
  financialMovementFindManyMock.mockResolvedValue([
    {
      amountCents: 1500,
      createdAt: day("2026-05-10"),
      expenseReportLine: { expenseName: "Ancienne dépense" },
    },
  ]);
});

describe("prepareExpenseReportValidation", () => {
  it("exige un Admin avant tout accès aux données", async () => {
    requireAdminMock.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));

    await expect(prepareExpenseReportValidation("report-1")).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(reportFindUniqueMock).not.toHaveBeenCalled();
  });

  it("déclenche notFound pour une Note introuvable", async () => {
    reportFindUniqueMock.mockResolvedValue(null);

    await expect(prepareExpenseReportValidation("report-1")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });

  it("construit un groupe par Subvention distincte plus un groupe Solde (ADR-0006)", async () => {
    const result = await prepareExpenseReportValidation("report-1");

    expect(result).toMatchObject({
      reportId: "report-1",
      status: "TAKEN_IN_CHARGE",
      assoId: "asso-1",
      assoSlug: "club-info",
    });
    expect(
      result.groups.map((g) => ({ key: g.key, kind: g.kind, subventionId: g.subventionId })),
    ).toEqual([
      { key: "sub-A", kind: "SUBVENTION", subventionId: "sub-A" },
      { key: "sub-B", kind: "SUBVENTION", subventionId: "sub-B" },
      { key: "CLUB_BALANCE", kind: "CLUB_BALANCE", subventionId: null },
    ]);
    expect(buildSubventionPdfDataMock).toHaveBeenCalledTimes(2);
    expect(buildSoldePdfDataMock).toHaveBeenCalledTimes(1);
  });

  it("ne produit que le groupe Solde pour une Note sans Subvention", async () => {
    reportFindUniqueMock.mockResolvedValue({
      ...report,
      lines: [line("l2", "CLUB_BALANCE", null, 500)],
    });

    const result = await prepareExpenseReportValidation("report-1");

    expect(result.groups.map((g) => g.kind)).toEqual(["CLUB_BALANCE"]);
    expect(subventionFindUniqueOrThrowMock).not.toHaveBeenCalled();
  });

  it("transmet aux builders le contexte bénéficiaire et le Trésorier des réglages", async () => {
    await prepareExpenseReportValidation("report-1");

    const { context } = buildSoldePdfDataMock.mock.calls[0][0];
    expect(context).toMatchObject({
      beneficiaryName: "Jean Dupont",
      associationName: "Club Info",
      iban: "FR7630006000011234567890189",
      treasurerName: "Marie Trésorière",
    });
    expect(context.reportDate).toBeInstanceOf(Date);
  });

  it("n'introduit pas d'espace parasite quand l'identité du bénéficiaire est incomplète", async () => {
    reportFindUniqueMock.mockResolvedValue({
      ...report,
      beneficiaryFirstname: null,
      beneficiaryLastname: "Dupont",
      lines: [line("l2", "CLUB_BALANCE", null, 500)],
    });

    await prepareExpenseReportValidation("report-1");

    expect(buildSoldePdfDataMock.mock.calls[0][0].context.beneficiaryName).toBe(
      "Dupont",
    );
  });

  it("ne passe au PDF Solde que les Lignes financées par le Solde", async () => {
    await prepareExpenseReportValidation("report-1");

    expect(buildSoldePdfDataMock.mock.calls[0][0].lines).toEqual([
      { amountCents: 500, date: day("2026-09-01"), description: "Dépense l2" },
    ]);
  });

  it("alimente le PDF Subvention avec la Campagne, les Subventions de la Structure et l'historique déjà remboursé", async () => {
    await prepareExpenseReportValidation("report-1");

    expect(subventionFindManyMock).toHaveBeenCalledWith({
      where: { campaignId: "campaign-of-sub-A", assoId: "asso-1" },
      select: { reason: true, amountCents: true },
    });
    expect(financialMovementFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          accountType: "SUBVENTION",
          origin: "EXPENSE_REPORT",
          subventionId: "sub-A",
        },
      }),
    );

    const input = buildSubventionPdfDataMock.mock.calls.find(
      ([arg]) => arg.grantReason === "Motif sub-A",
    )![0];
    expect(input).toMatchObject({
      campaignName: "Campagne sub-A",
      campaignGrantedOn: day("2026-02-01"),
      campaignSubventions: [{ reason: "Motif sub-A", amountCents: 10000 }],
      reimbursedHistory: [
        { amountCents: 1500, date: day("2026-05-10"), description: "Ancienne dépense" },
      ],
      linesToReimburse: [
        { amountCents: 1000, date: day("2026-09-01"), description: "Dépense l1" },
        { amountCents: 2000, date: day("2026-09-01"), description: "Dépense l3" },
      ],
    });
  });
});
