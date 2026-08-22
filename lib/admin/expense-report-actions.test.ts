import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireAdminMock,
  reportFindUniqueMock,
  reportUpdateMock,
  lineCreateMock,
  lineFindUniqueMock,
  lineUpdateMock,
  lineDeleteMock,
  lineFindManyMock,
  assoFindUniqueMock,
  subventionFindUniqueMock,
  financialMovementFindManyMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  reportFindUniqueMock: vi.fn(),
  reportUpdateMock: vi.fn(),
  lineCreateMock: vi.fn(),
  lineFindUniqueMock: vi.fn(),
  lineUpdateMock: vi.fn(),
  lineDeleteMock: vi.fn(),
  lineFindManyMock: vi.fn(),
  assoFindUniqueMock: vi.fn(),
  subventionFindUniqueMock: vi.fn(),
  financialMovementFindManyMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseReport: {
      findUnique: reportFindUniqueMock,
      update: reportUpdateMock,
    },
    expenseReportLine: {
      create: lineCreateMock,
      findUnique: lineFindUniqueMock,
      update: lineUpdateMock,
      delete: lineDeleteMock,
      findMany: lineFindManyMock,
    },
    asso: { findUnique: assoFindUniqueMock },
    subvention: { findUnique: subventionFindUniqueMock },
    financialMovement: { findMany: financialMovementFindManyMock },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const {
  takeOverExpenseReportAction,
  addExpenseReportLineAsAdminAction,
  updateExpenseReportLineAsAdminAction,
  deleteExpenseReportLineAsAdminAction,
} = await import("./expense-report-actions");

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

const admin = { id: "admin-1", isAdmin: true };

beforeEach(() => {
  requireAdminMock.mockReset();
  reportFindUniqueMock.mockReset();
  reportUpdateMock.mockReset();
  lineCreateMock.mockReset();
  lineFindUniqueMock.mockReset();
  lineUpdateMock.mockReset();
  lineDeleteMock.mockReset();
  lineFindManyMock.mockReset();
  assoFindUniqueMock.mockReset();
  subventionFindUniqueMock.mockReset();
  financialMovementFindManyMock.mockReset();
  revalidatePathMock.mockReset();
  requireAdminMock.mockResolvedValue(admin);
  lineFindManyMock.mockResolvedValue([]);
  financialMovementFindManyMock.mockResolvedValue([]);
});

describe("takeOverExpenseReportAction", () => {
  const valid = { id: "11111111-1111-1111-8111-111111111111" };

  it("refuse une Note introuvable", async () => {
    reportFindUniqueMock.mockResolvedValue(null);

    const result = await takeOverExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({ ok: false, error: "Note de frais introuvable." });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note n'est pas Soumise (Brouillon)", async () => {
    reportFindUniqueMock.mockResolvedValue({ id: valid.id, status: "DRAFT" });

    const result = await takeOverExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est pas en attente de prise en charge.",
    });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note est déjà Prise en charge (pas de double verrouillage)", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      status: "TAKEN_OVER",
    });

    const result = await takeOverExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est pas en attente de prise en charge.",
    });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("passe la Note de Soumise à Prise en charge et enregistre l'Admin", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      status: "SUBMITTED",
    });

    const result = await takeOverExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(reportUpdateMock).toHaveBeenCalledWith({
      where: { id: valid.id },
      data: {
        status: "TAKEN_OVER",
        takenByAdminId: admin.id,
        takenAt: expect.any(Date),
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/notes-de-frais/${valid.id}`,
    );
    expect(result).toEqual({ ok: true });
  });
});

const validLine = {
  expenseReportId: "22222222-2222-2222-8222-222222222222",
  beneficiaryFirstname: "Jean",
  beneficiaryLastname: "Dupont",
  iban: "FR7630006000011234567890189",
  amount: "42.50",
  expenseName: "Courses pour le pot d'intégration",
  typeDepenseId: "33333333-3333-3333-8333-333333333333",
  customLabel: "",
  fundingSource: "CLUB_BALANCE",
  subventionId: "",
};

const takenOverReport = {
  id: validLine.expenseReportId,
  assoId: "asso-1",
  status: "TAKEN_OVER",
};

describe("addExpenseReportLineAsAdminAction", () => {
  it("refuse une saisie invalide sans appeler requireAdmin", async () => {
    const result = await addExpenseReportLineAsAdminAction(
      { ok: false },
      formData({ ...validLine, amount: "-5" }),
    );

    expect(result.ok).toBe(false);
    expect(requireAdminMock).not.toHaveBeenCalled();
    expect(lineCreateMock).not.toHaveBeenCalled();
  });

  it("refuse une Note introuvable", async () => {
    reportFindUniqueMock.mockResolvedValue(null);

    const result = await addExpenseReportLineAsAdminAction(
      { ok: false },
      formData(validLine),
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Note de frais introuvable.",
      }),
    );
    expect(lineCreateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note n'est pas encore Prise en charge (Soumise)", async () => {
    reportFindUniqueMock.mockResolvedValue({
      ...takenOverReport,
      status: "SUBMITTED",
    });

    const result = await addExpenseReportLineAsAdminAction(
      { ok: false },
      formData(validLine),
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Cette Note de frais n'est plus modifiable.",
      }),
    );
    expect(lineCreateMock).not.toHaveBeenCalled();
  });

  it("refuse le Solde comme source pour une Structure qui n'est pas un Club (T11)", async () => {
    reportFindUniqueMock.mockResolvedValue(takenOverReport);
    assoFindUniqueMock.mockResolvedValue({ type: "COMMISSION" });

    const result = await addExpenseReportLineAsAdminAction(
      { ok: false },
      formData(validLine),
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Seuls les Clubs peuvent utiliser le Solde.",
      }),
    );
    expect(lineCreateMock).not.toHaveBeenCalled();
  });

  it("crée la Ligne sur une Note Prise en charge et revalide la page Admin", async () => {
    reportFindUniqueMock.mockResolvedValue(takenOverReport);
    assoFindUniqueMock.mockResolvedValue({ type: "CLUB" });
    financialMovementFindManyMock.mockResolvedValue([
      { movementType: "CREDIT", amountCents: 100000 },
    ]);

    const result = await addExpenseReportLineAsAdminAction(
      { ok: false },
      formData(validLine),
    );

    expect(lineCreateMock).toHaveBeenCalledWith({
      data: {
        expenseReportId: validLine.expenseReportId,
        beneficiaryFirstname: "Jean",
        beneficiaryLastname: "Dupont",
        iban: "FR7630006000011234567890189",
        amountCents: 4250,
        expenseName: "Courses pour le pot d'intégration",
        typeDepenseId: validLine.typeDepenseId,
        customLabel: null,
        fundingSource: "CLUB_BALANCE",
        subventionId: null,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/notes-de-frais/${validLine.expenseReportId}`,
    );
    expect(result).toEqual({ ok: true, warnings: [] });
  });

  it("déclenche le Warning Solde négatif sans bloquer la création (T13)", async () => {
    reportFindUniqueMock.mockResolvedValue(takenOverReport);
    assoFindUniqueMock.mockResolvedValue({ type: "CLUB" });
    financialMovementFindManyMock.mockResolvedValue([
      { movementType: "CREDIT", amountCents: 1000 },
    ]);

    const result = await addExpenseReportLineAsAdminAction(
      { ok: false },
      formData(validLine),
    );

    expect(lineCreateMock).toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      warnings: ["Ce Remboursement crée ou aggrave un solde négatif."],
    });
  });
});

describe("updateExpenseReportLineAsAdminAction", () => {
  const validUpdate = {
    ...validLine,
    id: "55555555-5555-5555-8555-555555555555",
  };

  const takenOverLine = {
    id: validUpdate.id,
    expenseReportId: validLine.expenseReportId,
    expenseReport: { assoId: "asso-1", status: "TAKEN_OVER" },
  };

  it("refuse une saisie invalide sans appeler requireAdmin", async () => {
    const result = await updateExpenseReportLineAsAdminAction(
      { ok: false },
      formData({ ...validUpdate, amount: "-5" }),
    );

    expect(result.ok).toBe(false);
    expect(requireAdminMock).not.toHaveBeenCalled();
    expect(lineUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse une Ligne introuvable", async () => {
    lineFindUniqueMock.mockResolvedValue(null);

    const result = await updateExpenseReportLineAsAdminAction(
      { ok: false },
      formData(validUpdate),
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Remboursement introuvable.",
      }),
    );
    expect(lineUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse le Solde comme source pour une Structure qui n'est pas un Club (T11)", async () => {
    lineFindUniqueMock.mockResolvedValue(takenOverLine);
    assoFindUniqueMock.mockResolvedValue({ type: "COMMISSION" });

    const result = await updateExpenseReportLineAsAdminAction(
      { ok: false },
      formData(validUpdate),
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Seuls les Clubs peuvent utiliser le Solde.",
      }),
    );
    expect(lineUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note n'est pas encore Prise en charge (Soumise)", async () => {
    lineFindUniqueMock.mockResolvedValue({
      ...takenOverLine,
      expenseReport: { assoId: "asso-1", status: "SUBMITTED" },
    });

    const result = await updateExpenseReportLineAsAdminAction(
      { ok: false },
      formData(validUpdate),
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Cette Note de frais n'est plus modifiable.",
      }),
    );
    expect(lineUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note est déjà Validée (immuable, ADR-0003)", async () => {
    lineFindUniqueMock.mockResolvedValue({
      ...takenOverLine,
      expenseReport: { assoId: "asso-1", status: "FINALIZED" },
    });

    const result = await updateExpenseReportLineAsAdminAction(
      { ok: false },
      formData(validUpdate),
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Cette Note de frais n'est plus modifiable.",
      }),
    );
    expect(lineUpdateMock).not.toHaveBeenCalled();
  });

  it("met à jour la Ligne d'une Note Prise en charge et revalide la page Admin", async () => {
    lineFindUniqueMock.mockResolvedValue(takenOverLine);
    assoFindUniqueMock.mockResolvedValue({ type: "CLUB" });
    financialMovementFindManyMock.mockResolvedValue([
      { movementType: "CREDIT", amountCents: 100000 },
    ]);

    const result = await updateExpenseReportLineAsAdminAction(
      { ok: false },
      formData(validUpdate),
    );

    expect(lineUpdateMock).toHaveBeenCalledWith({
      where: { id: validUpdate.id },
      data: expect.objectContaining({
        beneficiaryFirstname: "Jean",
        amountCents: 4250,
        fundingSource: "CLUB_BALANCE",
      }),
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/notes-de-frais/${validLine.expenseReportId}`,
    );
    expect(result).toEqual({ ok: true, warnings: [] });
  });

  it("réévalue les Warnings après la modification Admin (#18) : source changée vers une Subvention dépassée", async () => {
    lineFindUniqueMock.mockResolvedValue(takenOverLine);
    subventionFindUniqueMock.mockResolvedValue({
      assoId: "asso-1",
      amountCents: 1000,
      campaign: { publicationDate: new Date("2020-01-01"), date: new Date() },
    });

    const result = await updateExpenseReportLineAsAdminAction(
      { ok: false },
      formData({
        ...validUpdate,
        typeDepenseId: "",
        customLabel: "Location de matériel",
        fundingSource: "SUBVENTION",
        subventionId: "44444444-4444-4444-8444-444444444444",
      }),
    );

    expect(lineUpdateMock).toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      warnings: [
        "Ce Remboursement dépasse le montant restant de la Subvention.",
      ],
    });
  });

  it("déclenche le Warning Subvention ancienne après la modification Admin (T15, #18)", async () => {
    lineFindUniqueMock.mockResolvedValue(takenOverLine);
    subventionFindUniqueMock.mockResolvedValue({
      assoId: "asso-1",
      amountCents: 100000,
      campaign: {
        publicationDate: new Date("2020-01-01"),
        date: new Date("2020-01-01"),
      },
    });

    const result = await updateExpenseReportLineAsAdminAction(
      { ok: false },
      formData({
        ...validUpdate,
        typeDepenseId: "",
        customLabel: "Location de matériel",
        fundingSource: "SUBVENTION",
        subventionId: "44444444-4444-4444-8444-444444444444",
      }),
    );

    expect(lineUpdateMock).toHaveBeenCalled();
    expect(result).toEqual({
      ok: true,
      warnings: [
        "La Subvention utilisée date de plus d'un an ; elle sera probablement refusée.",
      ],
    });
  });

  it("exclut la Ligne éditée de ses propres cumuls en attente (T13)", async () => {
    lineFindUniqueMock.mockResolvedValue(takenOverLine);
    assoFindUniqueMock.mockResolvedValue({ type: "CLUB" });
    financialMovementFindManyMock.mockResolvedValue([
      { movementType: "CREDIT", amountCents: 4250 },
    ]);

    await updateExpenseReportLineAsAdminAction(
      { ok: false },
      formData(validUpdate),
    );

    expect(lineFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: validUpdate.id },
        }),
      }),
    );
  });
});

describe("deleteExpenseReportLineAsAdminAction", () => {
  const valid = { id: "66666666-6666-6666-8666-666666666666" };

  const takenOverLine = {
    id: valid.id,
    expenseReportId: validLine.expenseReportId,
    expenseReport: { status: "TAKEN_OVER" },
  };

  it("refuse une saisie invalide sans appeler requireAdmin", async () => {
    const result = await deleteExpenseReportLineAsAdminAction(
      { ok: false },
      formData({ id: "pas-un-uuid" }),
    );

    expect(result.ok).toBe(false);
    expect(requireAdminMock).not.toHaveBeenCalled();
    expect(lineDeleteMock).not.toHaveBeenCalled();
  });

  it("refuse une Ligne introuvable", async () => {
    lineFindUniqueMock.mockResolvedValue(null);

    const result = await deleteExpenseReportLineAsAdminAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({ ok: false, error: "Remboursement introuvable." });
    expect(lineDeleteMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note n'est pas encore Prise en charge (Soumise)", async () => {
    lineFindUniqueMock.mockResolvedValue({
      ...takenOverLine,
      expenseReport: { status: "SUBMITTED" },
    });

    const result = await deleteExpenseReportLineAsAdminAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
    });
    expect(lineDeleteMock).not.toHaveBeenCalled();
  });

  it("supprime la Ligne d'une Note Prise en charge et revalide la page Admin", async () => {
    lineFindUniqueMock.mockResolvedValue(takenOverLine);

    const result = await deleteExpenseReportLineAsAdminAction(
      { ok: false },
      formData(valid),
    );

    expect(lineDeleteMock).toHaveBeenCalledWith({ where: { id: valid.id } });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/notes-de-frais/${validLine.expenseReportId}`,
    );
    expect(result).toEqual({ ok: true });
  });
});
