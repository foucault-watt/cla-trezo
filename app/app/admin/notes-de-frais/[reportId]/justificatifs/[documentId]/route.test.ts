import { describe, it, expect, vi, beforeEach } from "vitest";

// Accès, 410 et en-têtes : cf. lib/storage/stored-file-route.test.ts.
const { getSessionMock, documentFindUniqueMock, readStoredFileMock } =
  vi.hoisted(() => ({
    getSessionMock: vi.fn(),
    documentFindUniqueMock: vi.fn(),
    readStoredFileMock: vi.fn(),
  }));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
  getDemoSession: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { supportingDocument: { findUnique: documentFindUniqueMock } },
}));
vi.mock("@/lib/storage/file-storage", () => ({
  readStoredFile: readStoredFileMock,
}));

const { GET } = await import("./route");

const admin = { id: "admin-1", isAdmin: true, structures: [] };

const document = {
  filePath: "club-info/report-1/doc.pdf",
  mimeType: "application/pdf",
  originalFilename: "facture.pdf",
  expenseReportId: "report-1",
};

function call() {
  return GET(new Request("http://localhost"), {
    params: Promise.resolve({ reportId: "report-1", documentId: "doc-1" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: admin });
  documentFindUniqueMock.mockResolvedValue(document);
  readStoredFileMock.mockResolvedValue(Buffer.from("%PDF-1.4"));
});

describe("GET justificatif (Admin)", () => {
  it("renvoie 404 si le Justificatif n'est pas rattaché à la Note de l'URL", async () => {
    documentFindUniqueMock.mockResolvedValue({ ...document, expenseReportId: "report-2" });

    expect((await call()).status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("sert le fichier en inline avec son type MIME, quelle que soit la Structure", async () => {
    const response = await call();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^inline; filename="facture\.pdf"/,
    );
  });
});
