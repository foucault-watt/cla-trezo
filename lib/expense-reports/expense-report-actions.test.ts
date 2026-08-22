import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireStructureAccessMock,
  reportCreateMock,
  reportFindUniqueMock,
  reportUpdateMock,
  reportDeleteMock,
  lineCreateMock,
  lineFindUniqueMock,
  lineUpdateMock,
  lineCountMock,
  lineFindManyMock,
  lineDeleteManyMock,
  documentCountMock,
  documentDeleteManyMock,
  assoFindUniqueMock,
  subventionFindUniqueMock,
  financialMovementFindManyMock,
  transactionMock,
  revalidatePathMock,
  deleteStoredFileMock,
} = vi.hoisted(() => ({
  requireStructureAccessMock: vi.fn(),
  reportCreateMock: vi.fn(),
  reportFindUniqueMock: vi.fn(),
  reportUpdateMock: vi.fn(),
  reportDeleteMock: vi.fn(),
  lineCreateMock: vi.fn(),
  lineFindUniqueMock: vi.fn(),
  lineUpdateMock: vi.fn(),
  lineCountMock: vi.fn(),
  lineFindManyMock: vi.fn(),
  lineDeleteManyMock: vi.fn(),
  documentCountMock: vi.fn(),
  documentDeleteManyMock: vi.fn(),
  assoFindUniqueMock: vi.fn(),
  subventionFindUniqueMock: vi.fn(),
  financialMovementFindManyMock: vi.fn(),
  transactionMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  deleteStoredFileMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireStructureAccess: requireStructureAccessMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseReport: {
      create: reportCreateMock,
      findUnique: reportFindUniqueMock,
      update: reportUpdateMock,
      delete: reportDeleteMock,
    },
    expenseReportLine: {
      create: lineCreateMock,
      findUnique: lineFindUniqueMock,
      update: lineUpdateMock,
      count: lineCountMock,
      findMany: lineFindManyMock,
      deleteMany: lineDeleteManyMock,
    },
    supportingDocument: {
      count: documentCountMock,
      deleteMany: documentDeleteManyMock,
    },
    asso: { findUnique: assoFindUniqueMock },
    subvention: { findUnique: subventionFindUniqueMock },
    financialMovement: { findMany: financialMovementFindManyMock },
    $transaction: transactionMock,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/storage/file-storage", () => ({
  deleteStoredFile: deleteStoredFileMock,
}));

const {
  createExpenseReportAction,
  updateExpenseReportAction,
  submitExpenseReportAction,
  deleteExpenseReportAction,
} = await import("./expense-report-actions");

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

const structureAccess = {
  structure: { assoId: "asso-1", slug: "club-info", name: "Club Info" },
  user: { id: "user-1" },
};

beforeEach(() => {
  requireStructureAccessMock.mockReset();
  reportCreateMock.mockReset();
  reportFindUniqueMock.mockReset();
  reportUpdateMock.mockReset();
  reportDeleteMock.mockReset();
  lineCreateMock.mockReset();
  lineFindUniqueMock.mockReset();
  lineUpdateMock.mockReset();
  lineCountMock.mockReset();
  lineFindManyMock.mockReset();
  lineDeleteManyMock.mockReset();
  documentCountMock.mockReset();
  documentDeleteManyMock.mockReset();
  assoFindUniqueMock.mockReset();
  subventionFindUniqueMock.mockReset();
  financialMovementFindManyMock.mockReset();
  transactionMock.mockReset();
  revalidatePathMock.mockReset();
  deleteStoredFileMock.mockReset();
  requireStructureAccessMock.mockResolvedValue(structureAccess);
  lineFindManyMock.mockResolvedValue([]);
  financialMovementFindManyMock.mockResolvedValue([]);
  transactionMock.mockImplementation((operations: Promise<unknown>[]) =>
    Promise.all(operations),
  );
  lineDeleteManyMock.mockResolvedValue({ count: 0 });
  documentDeleteManyMock.mockResolvedValue({ count: 0 });
  reportDeleteMock.mockResolvedValue({ id: "report-1" });
  deleteStoredFileMock.mockResolvedValue(undefined);
});

describe("createExpenseReportAction", () => {
  const valid = {
    assoSlug: "club-info",
    title: "Gala 2026",
    description: "Déplacement en car",
  };

  it("refuse un titre vide sans appeler requireStructureAccess", async () => {
    const result = await createExpenseReportAction(
      { ok: false },
      formData({ ...valid, title: "   " }),
    );

    expect(result.ok).toBe(false);
    expect(requireStructureAccessMock).not.toHaveBeenCalled();
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it("crée la Note en Brouillon pour la Structure de l'utilisateur et revalide la liste", async () => {
    reportCreateMock.mockResolvedValue({ id: "report-1" });

    const result = await createExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(reportCreateMock).toHaveBeenCalledWith({
      data: {
        assoId: "asso-1",
        createdBy: "user-1",
        title: valid.title,
        description: valid.description,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/app/club-info/notes-de-frais",
    );
    expect(result).toEqual({ ok: true, reportId: "report-1" });
  });
});

describe("updateExpenseReportAction", () => {
  const valid = {
    id: "11111111-1111-1111-8111-111111111111",
    assoSlug: "club-info",
    title: "Gala 2026 (corrigé)",
    description: "",
  };

  it("refuse une Note introuvable ou d'une autre Structure", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-autre",
      status: "DRAFT",
    });

    const result = await updateExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({ ok: false, error: "Note de frais introuvable." });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note est Prise en charge ou au-delà", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-1",
      status: "TAKEN_OVER",
    });

    const result = await updateExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
    });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it.each(["DRAFT", "SUBMITTED"] as const)(
    "met à jour le titre et la description en statut %s, et revalide la page détail",
    async (status) => {
      reportFindUniqueMock.mockResolvedValue({
        id: valid.id,
        assoId: "asso-1",
        status,
      });

      const result = await updateExpenseReportAction(
        { ok: false },
        formData(valid),
      );

      expect(reportUpdateMock).toHaveBeenCalledWith({
        where: { id: valid.id },
        data: { title: valid.title, description: null },
      });
      expect(revalidatePathMock).toHaveBeenCalledWith(
        `/app/club-info/notes-de-frais/${valid.id}`,
      );
      expect(result).toEqual({ ok: true });
    },
  );
});

describe("submitExpenseReportAction", () => {
  const valid = {
    id: "66666666-6666-6666-8666-666666666666",
    assoSlug: "club-info",
  };

  it("refuse une Note introuvable ou d'une autre Structure", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-autre",
      status: "DRAFT",
    });

    const result = await submitExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({ ok: false, error: "Note de frais introuvable." });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note n'est pas en Brouillon", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-1",
      status: "SUBMITTED",
    });

    const result = await submitExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est plus en Brouillon.",
    });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse une Note sans Ligne", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-1",
      status: "DRAFT",
      beneficiaryFirstname: "Jean",
      beneficiaryLastname: "Dupont",
      beneficiaryIban: "FR7630006000011234567890189",
    });
    lineCountMock.mockResolvedValue(0);

    const result = await submitExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Ajoutez au moins un Remboursement daté avant de soumettre.",
    });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse une Note sans Justificatif ni Attestation sur l'honneur", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-1",
      status: "DRAFT",
      beneficiaryFirstname: "Jean",
      beneficiaryLastname: "Dupont",
      beneficiaryIban: "FR7630006000011234567890189",
    });
    lineCountMock.mockResolvedValue(1);
    documentCountMock.mockResolvedValue(0);

    const result = await submitExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error:
        "Ajoutez au moins un Justificatif ou une Attestation sur l'honneur avant de soumettre.",
    });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("passe la Note de Brouillon à Soumise et revalide la page détail", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-1",
      status: "DRAFT",
      beneficiaryFirstname: "Jean",
      beneficiaryLastname: "Dupont",
      beneficiaryIban: "FR7630006000011234567890189",
    });
    lineCountMock.mockResolvedValue(1);
    documentCountMock.mockResolvedValue(1);

    const result = await submitExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(reportUpdateMock).toHaveBeenCalledWith({
      where: { id: valid.id },
      data: { status: "SUBMITTED", submittedAt: expect.any(Date) },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/club-info/notes-de-frais/${valid.id}`,
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("deleteExpenseReportAction", () => {
  const valid = {
    id: "77777777-7777-7777-8777-777777777777",
    assoSlug: "club-info",
  };

  it("refuse un id invalide sans appeler requireStructureAccess", async () => {
    const result = await deleteExpenseReportAction(
      { ok: false },
      formData({ ...valid, id: "not-a-uuid" }),
    );

    expect(result.ok).toBe(false);
    expect(requireStructureAccessMock).not.toHaveBeenCalled();
  });

  it("refuse une Note introuvable ou d'une autre Structure", async () => {
    reportFindUniqueMock.mockResolvedValue(null);

    const result = await deleteExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({ ok: false, error: "Note de frais introuvable." });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("refuse une Note qui n'est plus en Brouillon, même Soumise", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-1",
      status: "SUBMITTED",
      supportingDocuments: [],
    });

    const result = await deleteExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Seul un Brouillon peut être supprimé.",
    });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("supprime les Lignes, les Justificatifs puis la Note, et purge les fichiers stockés", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-1",
      status: "DRAFT",
      supportingDocuments: [
        { filePath: "asso/report-1/a.pdf" },
        { filePath: "asso/report-1/b.pdf" },
      ],
    });

    const result = await deleteExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(lineDeleteManyMock).toHaveBeenCalledWith({
      where: { expenseReportId: valid.id },
    });
    expect(documentDeleteManyMock).toHaveBeenCalledWith({
      where: { expenseReportId: valid.id },
    });
    expect(reportDeleteMock).toHaveBeenCalledWith({
      where: { id: valid.id },
    });
    expect(deleteStoredFileMock).toHaveBeenCalledWith("asso/report-1/a.pdf");
    expect(deleteStoredFileMock).toHaveBeenCalledWith("asso/report-1/b.pdf");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/app/club-info/notes-de-frais",
    );
    expect(result).toEqual({ ok: true });
  });

  it("reste ok même si la purge d'un fichier orphelin échoue", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-1",
      status: "DRAFT",
      supportingDocuments: [{ filePath: "asso/report-1/a.pdf" }],
    });
    deleteStoredFileMock.mockRejectedValue(new Error("ENOENT"));

    const result = await deleteExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({ ok: true });
  });
});
