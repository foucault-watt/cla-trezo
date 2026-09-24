import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireAdminMock,
  reportFindUniqueMock,
  reportUpdateMock,
  reportDeleteMock,
  lineCreateMock,
  lineFindUniqueMock,
  lineUpdateMock,
  lineDeleteMock,
  lineDeleteManyMock,
  lineFindManyMock,
  assoFindUniqueMock,
  subventionFindUniqueMock,
  financialMovementFindManyMock,
  financialMovementDeleteManyMock,
  expenseReportPdfDeleteManyMock,
  supportingDocumentDeleteManyMock,
  refAssoUserFindFirstMock,
  revalidatePathMock,
  transactionMock,
  deleteStoredFileMock,
  redirectMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  reportFindUniqueMock: vi.fn(),
  reportUpdateMock: vi.fn(),
  reportDeleteMock: vi.fn(),
  lineCreateMock: vi.fn(),
  lineFindUniqueMock: vi.fn(),
  lineUpdateMock: vi.fn(),
  lineDeleteMock: vi.fn(),
  lineDeleteManyMock: vi.fn(),
  lineFindManyMock: vi.fn(),
  assoFindUniqueMock: vi.fn(),
  subventionFindUniqueMock: vi.fn(),
  financialMovementFindManyMock: vi.fn(),
  financialMovementDeleteManyMock: vi.fn(),
  expenseReportPdfDeleteManyMock: vi.fn(),
  supportingDocumentDeleteManyMock: vi.fn(),
  refAssoUserFindFirstMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  transactionMock: vi.fn(),
  deleteStoredFileMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseReport: {
      findUnique: reportFindUniqueMock,
      update: reportUpdateMock,
      delete: reportDeleteMock,
    },
    expenseReportLine: {
      create: lineCreateMock,
      findUnique: lineFindUniqueMock,
      update: lineUpdateMock,
      delete: lineDeleteMock,
      deleteMany: lineDeleteManyMock,
      findMany: lineFindManyMock,
    },
    asso: { findUnique: assoFindUniqueMock },
    subvention: { findUnique: subventionFindUniqueMock },
    financialMovement: {
      findMany: financialMovementFindManyMock,
      deleteMany: financialMovementDeleteManyMock,
    },
    expenseReportPdf: { deleteMany: expenseReportPdfDeleteManyMock },
    supportingDocument: { deleteMany: supportingDocumentDeleteManyMock },
    refAssoUser: { findFirst: refAssoUserFindFirstMock },
    $transaction: transactionMock,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/storage/file-storage", () => ({
  deleteStoredFile: deleteStoredFileMock,
}));

const {
  takeOverExpenseReportAction,
  rejectExpenseReportAction,
  deleteExpenseReportAsAdminAction,
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
  reportDeleteMock.mockReset();
  lineCreateMock.mockReset();
  lineFindUniqueMock.mockReset();
  lineUpdateMock.mockReset();
  lineDeleteMock.mockReset();
  lineDeleteManyMock.mockReset();
  lineFindManyMock.mockReset();
  assoFindUniqueMock.mockReset();
  subventionFindUniqueMock.mockReset();
  financialMovementFindManyMock.mockReset();
  financialMovementDeleteManyMock.mockReset();
  expenseReportPdfDeleteManyMock.mockReset();
  supportingDocumentDeleteManyMock.mockReset();
  refAssoUserFindFirstMock.mockReset();
  revalidatePathMock.mockReset();
  transactionMock.mockReset();
  deleteStoredFileMock.mockReset();
  redirectMock.mockClear();
  requireAdminMock.mockResolvedValue(admin);
  lineFindManyMock.mockResolvedValue([]);
  financialMovementFindManyMock.mockResolvedValue([]);
  transactionMock.mockImplementation((operations: Promise<unknown>[]) =>
    Promise.all(operations),
  );
  deleteStoredFileMock.mockResolvedValue(undefined);
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

describe("rejectExpenseReportAction", () => {
  const valid = {
    id: "33333333-3333-3333-8333-333333333333",
    reason: "  Justificatif illisible.  ",
  };

  it("exige un motif de rejet", async () => {
    const result = await rejectExpenseReportAction(
      { ok: false },
      formData({ ...valid, reason: "   " }),
    );

    expect(result).toEqual({
      ok: false,
      error: "Indiquez le motif du rejet.",
    });
    expect(reportFindUniqueMock).not.toHaveBeenCalled();
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse une Note introuvable", async () => {
    reportFindUniqueMock.mockResolvedValue(null);

    const result = await rejectExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({ ok: false, error: "Note de frais introuvable." });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note n'est pas Prise en charge", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      status: "SUBMITTED",
    });

    const result = await rejectExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais ne peut pas être rejetée.",
    });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("passe une Note Prise en charge à Rejetée avec son motif", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      status: "TAKEN_OVER",
    });

    const result = await rejectExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(reportUpdateMock).toHaveBeenCalledWith({
      where: { id: valid.id },
      data: { status: "REJECTED", rejectionReason: "Justificatif illisible." },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/notes-de-frais/${valid.id}`,
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("deleteExpenseReportAsAdminAction", () => {
  const valid = { id: "44444444-4444-4444-8444-444444444444" };

  it("refuse une Note introuvable", async () => {
    reportFindUniqueMock.mockResolvedValue(null);

    const result = await deleteExpenseReportAsAdminAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({ ok: false, error: "Note de frais introuvable." });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("supprime en cascade les mouvements, PDF, Lignes, Justificatifs puis la Note, quel que soit le statut", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      lines: [{ id: "line-1" }, { id: "line-2" }],
      supportingDocuments: [{ filePath: "asso/report/a.pdf" }],
      pdfs: [{ filePath: "asso/report/final-solde.pdf" }],
    });

    await deleteExpenseReportAsAdminAction(
      { ok: false },
      formData(valid),
    ).catch(() => {});

    expect(financialMovementDeleteManyMock).toHaveBeenCalledWith({
      where: { expenseReportLineId: { in: ["line-1", "line-2"] } },
    });
    expect(expenseReportPdfDeleteManyMock).toHaveBeenCalledWith({
      where: { expenseReportId: valid.id },
    });
    expect(lineDeleteManyMock).toHaveBeenCalledWith({
      where: { expenseReportId: valid.id },
    });
    expect(supportingDocumentDeleteManyMock).toHaveBeenCalledWith({
      where: { expenseReportId: valid.id },
    });
    expect(reportDeleteMock).toHaveBeenCalledWith({
      where: { id: valid.id },
    });
    expect(deleteStoredFileMock).toHaveBeenCalledWith("asso/report/a.pdf");
    expect(deleteStoredFileMock).toHaveBeenCalledWith(
      "asso/report/final-solde.pdf",
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/app/admin/notes-de-frais?toast=Note+de+frais+supprim%C3%A9e.&toastType=success",
    );
  });

  it("reste ok même si la purge d'un fichier orphelin échoue", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      lines: [],
      supportingDocuments: [{ filePath: "asso/report/a.pdf" }],
      pdfs: [],
    });
    deleteStoredFileMock.mockRejectedValue(new Error("ENOENT"));

    await expect(
      deleteExpenseReportAsAdminAction({ ok: false }, formData(valid)),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalled();
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
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      status: "SUBMITTED",
    });

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
