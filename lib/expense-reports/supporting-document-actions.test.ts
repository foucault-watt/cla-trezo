import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireStructureMemberMock,
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
  requireStructureMemberMock: vi.fn(),
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

vi.mock("@/lib/auth/guards", () => ({
  requireStructureMember: requireStructureMemberMock,
}));
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

const { addSupportingDocumentsAction, removeSupportingDocumentAction } =
  await import("./supporting-document-actions");

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

const structureAccess = {
  structure: { assoId: "asso-1", slug: "club-info", name: "Club Info" },
  user: { id: "user-1" },
};

const draftReport = {
  id: "report-1",
  assoId: "asso-1",
  status: "DRAFT",
  asso: { slug: "club-info" },
};

const validFields = {
  expenseReportId: "11111111-1111-1111-8111-111111111111",
  assoSlug: "club-info",
  documentType: "RECEIPT",
};

beforeEach(() => {
  requireStructureMemberMock.mockReset().mockResolvedValue(structureAccess);
  reportFindUniqueMock.mockReset().mockResolvedValue(draftReport);
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

describe("addSupportingDocumentsAction", () => {
  it("refuse une saisie invalide sans appeler requireStructureMember", async () => {
    const result = await addSupportingDocumentsAction(
      { ok: false },
      formData({ ...validFields, documentType: "AUTRE" }, [
        { name: "facture.pdf", content: pdfContent, type: "application/pdf" },
      ]),
    );

    expect(result.ok).toBe(false);
    expect(requireStructureMemberMock).not.toHaveBeenCalled();
  });

  it("refuse une Note introuvable ou d'une autre Structure", async () => {
    reportFindUniqueMock.mockResolvedValue({ ...draftReport, assoId: "autre" });

    const result = await addSupportingDocumentsAction(
      { ok: false },
      formData(validFields, [
        { name: "facture.pdf", content: pdfContent, type: "application/pdf" },
      ]),
    );

    expect(result).toEqual({ ok: false, error: "Note de frais introuvable." });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note est Prise en charge ou au-delà", async () => {
    reportFindUniqueMock.mockResolvedValue({
      ...draftReport,
      status: "TAKEN_OVER",
    });

    const result = await addSupportingDocumentsAction(
      { ok: false },
      formData(validFields, [
        { name: "facture.pdf", content: pdfContent, type: "application/pdf" },
      ]),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
    });
  });

  it("autorise l'ajout d'un Justificatif en statut Soumise", async () => {
    reportFindUniqueMock.mockResolvedValue({
      ...draftReport,
      status: "SUBMITTED",
    });

    const result = await addSupportingDocumentsAction(
      { ok: false },
      formData(validFields, [
        { name: "facture.pdf", content: pdfContent, type: "application/pdf" },
      ]),
    );

    expect(result.ok).toBe(true);
  });

  it("refuse d'ajouter un Justificatif si une Attestation existe déjà (exclusivité)", async () => {
    documentFindManyMock.mockResolvedValue([
      { id: "doc-1", type: "HONOR_STATEMENT", filePath: "old/path.pdf" },
    ]);

    const result = await addSupportingDocumentsAction(
      { ok: false },
      formData(validFields, [
        { name: "facture.pdf", content: pdfContent, type: "application/pdf" },
      ]),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Attestation sur l'honneur est déjà présente/);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("refuse d'ajouter une Attestation si des Justificatifs existent déjà (exclusivité)", async () => {
    documentFindManyMock.mockResolvedValue([
      { id: "doc-1", type: "RECEIPT", filePath: "old/path.pdf" },
    ]);

    const result = await addSupportingDocumentsAction(
      { ok: false },
      formData({ ...validFields, documentType: "HONOR_STATEMENT" }, [
        {
          name: "attestation.pdf",
          content: pdfContent,
          type: "application/pdf",
        },
      ]),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Justificatifs sont déjà présents/);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("refuse un envoi sans fichier", async () => {
    const result = await addSupportingDocumentsAction(
      { ok: false },
      formData(validFields, []),
    );

    expect(result).toEqual({ ok: false, error: "Aucun fichier sélectionné." });
  });

  it("refuse si le total dépasse la limite de 10 Justificatifs", async () => {
    documentFindManyMock.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => ({
        id: `doc-${i}`,
        type: "RECEIPT",
        filePath: `existing/${i}.pdf`,
      })),
    );

    const result = await addSupportingDocumentsAction(
      { ok: false },
      formData(validFields, [
        { name: "a.pdf", content: pdfContent, type: "application/pdf" },
        { name: "b.pdf", content: pdfContent, type: "application/pdf" },
      ]),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Maximum 10/);
  });

  it("refuse un fichier trop gros", async () => {
    const hugeContent = Buffer.concat([
      Buffer.from("%PDF-1.4", "latin1"),
      Buffer.alloc(11 * 1024 * 1024),
    ]);

    const result = await addSupportingDocumentsAction(
      { ok: false },
      formData(validFields, [
        { name: "gros.pdf", content: hugeContent, type: "application/pdf" },
      ]),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/10 Mo/);
  });

  it("refuse un fichier dont le contenu ne correspond à aucun format accepté", async () => {
    const result = await addSupportingDocumentsAction(
      { ok: false },
      formData(validFields, [
        {
          name: "renomme.pdf",
          content: Buffer.from("pas vraiment un PDF"),
          type: "application/pdf",
        },
      ]),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Format de fichier non accepté/);
  });

  it("crée les Justificatifs, écrit les fichiers puis revalide la page", async () => {
    const result = await addSupportingDocumentsAction(
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
          mimeType: "application/pdf",
        }),
      ],
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/app/[assoSlug]/notes-de-frais",
      "layout",
    );
    expect(result).toEqual({ ok: true });
  });

  it("remplace l'Attestation existante (supprime l'ancienne, insère la nouvelle)", async () => {
    documentFindManyMock.mockResolvedValue([
      { id: "old-doc", type: "HONOR_STATEMENT", filePath: "old/path.pdf" },
    ]);

    const result = await addSupportingDocumentsAction(
      { ok: false },
      formData({ ...validFields, documentType: "HONOR_STATEMENT" }, [
        {
          name: "attestation.pdf",
          content: pdfContent,
          type: "application/pdf",
        },
      ]),
    );

    expect(txDeleteManyMock).toHaveBeenCalledWith({
      where: { id: { in: ["old-doc"] } },
    });
    expect(txCreateManyMock).toHaveBeenCalledWith({
      data: [expect.objectContaining({ type: "HONOR_STATEMENT" })],
    });
    expect(deleteStoredFileMock).toHaveBeenCalledWith("old/path.pdf");
    expect(result).toEqual({ ok: true });
  });
});

describe("removeSupportingDocumentAction", () => {
  const validRemove = {
    id: "22222222-2222-2222-8222-222222222222",
    assoSlug: "club-info",
  };

  it("refuse un document introuvable ou d'une autre Structure", async () => {
    documentFindUniqueMock.mockResolvedValue({
      id: validRemove.id,
      filePath: "some/path.pdf",
      expenseReportId: "report-1",
      expenseReport: { assoId: "autre-asso", status: "DRAFT" },
    });

    const result = await removeSupportingDocumentAction(
      { ok: false },
      formData(validRemove),
    );

    expect(result).toEqual({ ok: false, error: "Justificatif introuvable." });
    expect(documentDeleteMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note n'est plus en Brouillon", async () => {
    documentFindUniqueMock.mockResolvedValue({
      id: validRemove.id,
      filePath: "some/path.pdf",
      expenseReportId: "report-1",
      expenseReport: { assoId: "asso-1", status: "TAKEN_OVER" },
    });

    const result = await removeSupportingDocumentAction(
      { ok: false },
      formData(validRemove),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
    });
    expect(documentDeleteMock).not.toHaveBeenCalled();
  });

  it("supprime le document en base et son fichier sur disque, puis revalide", async () => {
    documentFindUniqueMock.mockResolvedValue({
      id: validRemove.id,
      filePath: "club-info/report-1/mock-0.pdf",
      expenseReportId: "report-1",
      expenseReport: { assoId: "asso-1", status: "DRAFT" },
    });

    const result = await removeSupportingDocumentAction(
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
      "/app/[assoSlug]/notes-de-frais",
      "layout",
    );
    expect(result).toEqual({ ok: true });
  });
});
