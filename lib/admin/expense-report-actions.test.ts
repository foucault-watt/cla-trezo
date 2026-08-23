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
  refAssoUserFindFirstMock,
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
  refAssoUserFindFirstMock: vi.fn(),
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
    refAssoUser: { findFirst: refAssoUserFindFirstMock },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const {
  takeOverExpenseReportAction,
  deleteExpenseReportLineAsAdminAction,
  updateExpenseReportAsAdminAction,
  updateExpenseReportBeneficiaryAsAdminAction,
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
  refAssoUserFindFirstMock.mockReset();
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
};

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

describe("updateExpenseReportAsAdminAction", () => {
  const valid = {
    id: "88888888-8888-8888-8888-888888888888",
    title: "Gala 2026 corrigé",
    description: "",
  };

  it("refuse une Note introuvable", async () => {
    reportFindUniqueMock.mockResolvedValue(null);

    const result = await updateExpenseReportAsAdminAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({ ok: false, error: "Note de frais introuvable." });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse tant que la Note n'est pas Prise en charge (Soumise)", async () => {
    reportFindUniqueMock.mockResolvedValue({ id: valid.id, status: "SUBMITTED" });

    const result = await updateExpenseReportAsAdminAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
    });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("met à jour le titre et la description d'une Note Prise en charge", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      status: "TAKEN_OVER",
    });

    const result = await updateExpenseReportAsAdminAction(
      { ok: false },
      formData(valid),
    );

    expect(reportUpdateMock).toHaveBeenCalledWith({
      where: { id: valid.id },
      data: { title: valid.title, description: null },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/notes-de-frais/${valid.id}`,
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("updateExpenseReportBeneficiaryAsAdminAction", () => {
  const reportId = "99999999-9999-4999-8999-999999999999";
  const existingReport = {
    id: reportId,
    assoId: "asso-1",
    status: "TAKEN_OVER",
    beneficiaryUserId: null,
    beneficiaryFirstname: "Ancienne",
    beneficiaryLastname: "Personne",
    beneficiaryIban: "FR7630006000011234567890189",
  };

  it("refuse tant que la Note n'est pas Prise en charge (Soumise)", async () => {
    reportFindUniqueMock.mockResolvedValue({
      ...existingReport,
      status: "SUBMITTED",
    });

    const result = await updateExpenseReportBeneficiaryAsAdminAction(
      { ok: false },
      formData({
        id: reportId,
        beneficiaryKind: "CUSTOM",
        beneficiaryUserId: "",
        beneficiaryFirstname: "Nouvelle",
        beneficiaryLastname: "Personne",
        beneficiaryIban: "FR7630006000098765432109876",
      }),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
    });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("résout l'identité depuis le membre sélectionné plutôt que le texte du formulaire", async () => {
    reportFindUniqueMock.mockResolvedValue(existingReport);
    refAssoUserFindFirstMock.mockResolvedValue({
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      user: { firstname: "Camille", lastname: "Martin" },
    });

    const result = await updateExpenseReportBeneficiaryAsAdminAction(
      { ok: false },
      formData({
        id: reportId,
        beneficiaryKind: "MEMBER",
        beneficiaryUserId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        beneficiaryFirstname: "Valeur ignorée",
        beneficiaryLastname: "Valeur ignorée",
        beneficiaryIban: "FR7630006000098765432109876",
      }),
    );

    expect(reportUpdateMock).toHaveBeenCalledWith({
      where: { id: reportId },
      data: {
        beneficiaryUserId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        beneficiaryFirstname: "Camille",
        beneficiaryLastname: "Martin",
        beneficiaryIban: "FR7630006000098765432109876",
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/notes-de-frais/${reportId}`,
    );
    expect(result).toEqual({ ok: true });
  });

  it("accepte l'IBAN complet, sans le restreindre au dernier chiffre saisi", async () => {
    reportFindUniqueMock.mockResolvedValue(existingReport);

    const result = await updateExpenseReportBeneficiaryAsAdminAction(
      { ok: false },
      formData({
        id: reportId,
        beneficiaryKind: "CUSTOM",
        beneficiaryUserId: "",
        beneficiaryFirstname: "Nouvelle",
        beneficiaryLastname: "Personne",
        beneficiaryIban: "FR7630006000098765432109876",
      }),
    );

    expect(reportUpdateMock).toHaveBeenCalledWith({
      where: { id: reportId },
      data: expect.objectContaining({
        beneficiaryIban: "FR7630006000098765432109876",
      }),
    });
    expect(result).toEqual({ ok: true });
  });
});
