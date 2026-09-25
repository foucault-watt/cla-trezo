import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  documentFindManyMock,
  transactionMock,
  txDeleteManyMock,
  txCreateManyMock,
  buildSupportingDocumentPathMock,
  writeStoredFileMock,
  deleteStoredFileMock,
} = vi.hoisted(() => ({
  documentFindManyMock: vi.fn(),
  transactionMock: vi.fn(),
  txDeleteManyMock: vi.fn(),
  txCreateManyMock: vi.fn(),
  buildSupportingDocumentPathMock: vi.fn(),
  writeStoredFileMock: vi.fn(),
  deleteStoredFileMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    supportingDocument: { findMany: documentFindManyMock },
    $transaction: transactionMock,
  },
}));
vi.mock("@/lib/storage/file-storage", () => ({
  buildSupportingDocumentPath: buildSupportingDocumentPathMock,
  writeStoredFile: writeStoredFileMock,
  deleteStoredFile: deleteStoredFileMock,
}));

const { addSupportingDocumentsCore, extractFiles } = await import(
  "./supporting-document-shared"
);

const pdfContent = Buffer.from("%PDF-1.4 contenu de test", "latin1");
const pdf = (name: string) =>
  new File([new Uint8Array(pdfContent)], name, { type: "application/pdf" });

const report = { id: "report-1", assoSlug: "club-info" };

beforeEach(() => {
  vi.clearAllMocks();
  documentFindManyMock.mockResolvedValue([]);
  writeStoredFileMock.mockResolvedValue(undefined);
  deleteStoredFileMock.mockResolvedValue(undefined);
  txDeleteManyMock.mockResolvedValue({ count: 0 });
  txCreateManyMock.mockResolvedValue({ count: 1 });
  transactionMock.mockImplementation(async (callback) =>
    callback({
      supportingDocument: {
        deleteMany: txDeleteManyMock,
        createMany: txCreateManyMock,
      },
    }),
  );
  let counter = 0;
  buildSupportingDocumentPathMock.mockImplementation(
    () => `club-info/report-1/new-${counter++}.pdf`,
  );
});

describe("extractFiles", () => {
  it("ne garde que les fichiers non vides du champ files", () => {
    const fd = new FormData();
    fd.append("files", pdf("a.pdf"));
    fd.append("files", new File([], "vide.pdf"));
    fd.append("files", "pas un fichier");
    fd.append("other", pdf("ailleurs.pdf"));

    expect(extractFiles(fd).map((file) => file.name)).toEqual(["a.pdf"]);
  });
});

describe("addSupportingDocumentsCore", () => {
  it("supprime les fichiers déjà écrits et n'écrit rien en base si une écriture disque échoue", async () => {
    writeStoredFileMock
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("disque plein"));

    await expect(
      addSupportingDocumentsCore({
        report,
        documentType: "RECEIPT",
        files: [pdf("a.pdf"), pdf("b.pdf")],
      }),
    ).rejects.toThrow("disque plein");

    expect(deleteStoredFileMock).toHaveBeenCalledTimes(1);
    expect(deleteStoredFileMock).toHaveBeenCalledWith("club-info/report-1/new-0.pdf");
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("supprime les fichiers écrits si la transaction échoue", async () => {
    txCreateManyMock.mockRejectedValue(new Error("contrainte violée"));

    await expect(
      addSupportingDocumentsCore({
        report,
        documentType: "RECEIPT",
        files: [pdf("a.pdf"), pdf("b.pdf")],
      }),
    ).rejects.toThrow("contrainte violée");

    expect(deleteStoredFileMock.mock.calls.map(([path]) => path).sort()).toEqual([
      "club-info/report-1/new-0.pdf",
      "club-info/report-1/new-1.pdf",
    ]);
  });

  it("n'efface pas l'ancienne Attestation si le remplacement échoue en base", async () => {
    documentFindManyMock.mockResolvedValue([
      { id: "old-doc", type: "HONOR_STATEMENT", filePath: "old/attestation.pdf" },
    ]);
    txCreateManyMock.mockRejectedValue(new Error("contrainte violée"));

    await expect(
      addSupportingDocumentsCore({
        report,
        documentType: "HONOR_STATEMENT",
        files: [pdf("attestation.pdf")],
      }),
    ).rejects.toThrow();

    expect(deleteStoredFileMock).not.toHaveBeenCalledWith("old/attestation.pdf");
  });

  it("réussit même si le nettoyage de l'ancienne Attestation échoue, sans toucher aux nouveaux fichiers", async () => {
    documentFindManyMock.mockResolvedValue([
      { id: "old-doc", type: "HONOR_STATEMENT", filePath: "old/attestation.pdf" },
    ]);
    deleteStoredFileMock.mockRejectedValue(new Error("fichier verrouillé"));

    const result = await addSupportingDocumentsCore({
      report,
      documentType: "HONOR_STATEMENT",
      files: [pdf("attestation.pdf")],
    });

    expect(result).toEqual({ ok: true });
    expect(deleteStoredFileMock).toHaveBeenCalledTimes(1);
    expect(deleteStoredFileMock).toHaveBeenCalledWith("old/attestation.pdf");
  });

  it("refuse plus d'une Attestation sur l'honneur par envoi", async () => {
    const result = await addSupportingDocumentsCore({
      report,
      documentType: "HONOR_STATEMENT",
      files: [pdf("a.pdf"), pdf("b.pdf")],
    });

    expect(result.ok).toBe(false);
    expect(writeStoredFileMock).not.toHaveBeenCalled();
  });

  it("valide tous les fichiers avant d'en écrire un seul", async () => {
    const invalid = new File([new Uint8Array(Buffer.from("texte brut"))], "notes.txt");

    const result = await addSupportingDocumentsCore({
      report,
      documentType: "RECEIPT",
      files: [pdf("a.pdf"), invalid],
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('"notes.txt"');
    expect(writeStoredFileMock).not.toHaveBeenCalled();
  });
});
