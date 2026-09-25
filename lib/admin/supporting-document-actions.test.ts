import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireAdminMock,
  reportFindUniqueMock,
  documentFindManyMock,
  documentFindUniqueMock,
  documentDeleteMock,
  transactionMock,
  txDeleteManyMock,
  txCreateManyMock,
  revalidatePathMock,
  buildSupportingDocumentPathMock,
  writeStoredFileMock,
  deleteStoredFileMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  reportFindUniqueMock: vi.fn(),
  documentFindManyMock: vi.fn(),
  documentFindUniqueMock: vi.fn(),
  documentDeleteMock: vi.fn(),
  transactionMock: vi.fn(),
  txDeleteManyMock: vi.fn(),
  txCreateManyMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  buildSupportingDocumentPathMock: vi.fn(),
  writeStoredFileMock: vi.fn(),
  deleteStoredFileMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseReport: { findUnique: reportFindUniqueMock },
    supportingDocument: {
      findMany: documentFindManyMock,
      findUnique: documentFindUniqueMock,
      delete: documentDeleteMock,
    },
    $transaction: transactionMock,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/storage/file-storage", () => ({
  buildSupportingDocumentPath: buildSupportingDocumentPathMock,
  writeStoredFile: writeStoredFileMock,
  deleteStoredFile: deleteStoredFileMock,
}));

const {
  addSupportingDocumentsAsAdminAction,
  removeSupportingDocumentAsAdminAction,
} = await import("./supporting-document-actions");

function formData(
  entries: Record<string, string>,
  files: { name: string; content: Buffer; type?: string }[] = [],
): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  for (const file of files) {
    fd.append(
      "files",
      new File([new Uint8Array(file.content)], file.name, {
        type: file.type ?? "application/octet-stream",
      }),
    );
  }
  return fd;
}

const pdfContent = Buffer.from("%PDF-1.4 contenu de test", "latin1");
const admin = { id: "admin-1", isAdmin: true };

const takenOverReport = {
  id: "report-1",
  status: "TAKEN_OVER",
  asso: { slug: "club-info" },
};

const validFields = {
  expenseReportId: "11111111-1111-1111-8111-111111111111",
  documentType: "RECEIPT",
};

beforeEach(() => {
  requireAdminMock.mockReset().mockResolvedValue(admin);
  reportFindUniqueMock.mockReset().mockResolvedValue(takenOverReport);
  documentFindManyMock.mockReset().mockResolvedValue([]);
  documentFindUniqueMock.mockReset();
  documentDeleteMock.mockReset();
  revalidatePathMock.mockReset();
  buildSupportingDocumentPathMock.mockReset();
  writeStoredFileMock.mockReset().mockResolvedValue(undefined);
  deleteStoredFileMock.mockReset().mockResolvedValue(undefined);
  txDeleteManyMock.mockReset().mockResolvedValue({ count: 0 });
  txCreateManyMock.mockReset().mockResolvedValue({ count: 1 });
  transactionMock.mockReset().mockImplementation(async (callback) =>
    callback({
      supportingDocument: {
        deleteMany: txDeleteManyMock,
        createMany: txCreateManyMock,
      },
    }),
  );
  let counter = 0;
  buildSupportingDocumentPathMock.mockImplementation(
    () => `club-info/report-1/mock-${counter++}.pdf`,
  );
});

describe("addSupportingDocumentsAsAdminAction", () => {
  it("refuse une saisie invalide sans appeler requireAdmin", async () => {
    const result = await addSupportingDocumentsAsAdminAction(
      { ok: false },
      formData({ ...validFields, documentType: "AUTRE" }, [
        { name: "facture.pdf", content: pdfContent, type: "application/pdf" },
      ]),
    );

    expect(result.ok).toBe(false);
    expect(requireAdminMock).not.toHaveBeenCalled();
  });

  it("refuse une Note introuvable", async () => {
    reportFindUniqueMock.mockResolvedValue(null);

    const result = await addSupportingDocumentsAsAdminAction(
      { ok: false },
      formData(validFields, [
        { name: "facture.pdf", content: pdfContent, type: "application/pdf" },
      ]),
    );

    expect(result).toEqual({ ok: false, error: "Note de frais introuvable." });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("refuse tant que la Note n'est pas Prise en charge (Soumise)", async () => {
    reportFindUniqueMock.mockResolvedValue({
      ...takenOverReport,
      status: "SUBMITTED",
    });

    const result = await addSupportingDocumentsAsAdminAction(
      { ok: false },
      formData(validFields, [
        { name: "facture.pdf", content: pdfContent, type: "application/pdf" },
      ]),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
    });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("refuse d'ajouter un Justificatif si une Attestation existe déjà (exclusivité)", async () => {
    documentFindManyMock.mockResolvedValue([
      { id: "doc-1", type: "HONOR_STATEMENT", filePath: "old/path.pdf" },
    ]);

    const result = await addSupportingDocumentsAsAdminAction(
      { ok: false },
      formData(validFields, [
        { name: "facture.pdf", content: pdfContent, type: "application/pdf" },
      ]),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Attestation sur l'honneur est déjà présente/);
  });

  it("crée le Justificatif sur la Note Prise en charge et revalide la page Admin", async () => {
    const result = await addSupportingDocumentsAsAdminAction(
      { ok: false },
      formData(validFields, [
        { name: "facture.pdf", content: pdfContent, type: "application/pdf" },
      ]),
    );

    expect(writeStoredFileMock).toHaveBeenCalledTimes(1);
    expect(txCreateManyMock).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          expenseReportId: "report-1",
          type: "RECEIPT",
          originalFilename: "facture.pdf",
        }),
      ],
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/app/admin/notes-de-frais",
      "layout",
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("removeSupportingDocumentAsAdminAction", () => {
  const validRemove = { id: "22222222-2222-2222-8222-222222222222" };

  it("refuse un document introuvable", async () => {
    documentFindUniqueMock.mockResolvedValue(null);

    const result = await removeSupportingDocumentAsAdminAction(
      { ok: false },
      formData(validRemove),
    );

    expect(result).toEqual({ ok: false, error: "Justificatif introuvable." });
    expect(documentDeleteMock).not.toHaveBeenCalled();
  });

  it("refuse tant que la Note n'est pas Prise en charge (Soumise)", async () => {
    documentFindUniqueMock.mockResolvedValue({
      id: validRemove.id,
      filePath: "some/path.pdf",
      expenseReportId: "report-1",
      expenseReport: { status: "SUBMITTED" },
    });

    const result = await removeSupportingDocumentAsAdminAction(
      { ok: false },
      formData(validRemove),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
    });
    expect(documentDeleteMock).not.toHaveBeenCalled();
  });

  it("supprime le document en base et son fichier sur disque, puis revalide la page Admin", async () => {
    documentFindUniqueMock.mockResolvedValue({
      id: validRemove.id,
      filePath: "club-info/report-1/mock-0.pdf",
      expenseReportId: "report-1",
      expenseReport: { status: "TAKEN_OVER" },
    });

    const result = await removeSupportingDocumentAsAdminAction(
      { ok: false },
      formData(validRemove),
    );

    expect(documentDeleteMock).toHaveBeenCalledWith({
      where: { id: validRemove.id },
    });
    expect(deleteStoredFileMock).toHaveBeenCalledWith(
      "club-info/report-1/mock-0.pdf",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/app/admin/notes-de-frais",
      "layout",
    );
    expect(result).toEqual({ ok: true });
  });
});
