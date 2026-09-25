import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionMock, documentFindUniqueMock, readStoredFileMock } = vi.hoisted(
  () => ({
    getSessionMock: vi.fn(),
    documentFindUniqueMock: vi.fn(),
    readStoredFileMock: vi.fn(),
  }),
);

vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { supportingDocument: { findUnique: documentFindUniqueMock } },
}));
vi.mock("@/lib/storage/file-storage", () => ({
  readStoredFile: readStoredFileMock,
}));

const { GET } = await import("./route");

const admin = { id: "admin-1", isAdmin: true, structures: [] };

const document = {
  filePath: "club-info/report-1/doc.jpg",
  mimeType: "image/jpeg",
  originalFilename: "facture.jpg",
  expenseReportId: "report-1",
};

function call(params = { reportId: "report-1", documentId: "doc-1" }) {
  return GET(new Request("http://localhost"), { params: Promise.resolve(params) });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: admin });
  documentFindUniqueMock.mockResolvedValue(document);
  readStoredFileMock.mockResolvedValue(Buffer.from("jpeg"));
});

describe("GET justificatif (Admin)", () => {
  it("renvoie 401 sans session", async () => {
    getSessionMock.mockResolvedValue({});

    expect((await call()).status).toBe(401);
  });

  it("renvoie 404 à un non-Admin", async () => {
    getSessionMock.mockResolvedValue({ user: { ...admin, isAdmin: false } });

    expect((await call()).status).toBe(404);
    expect(documentFindUniqueMock).not.toHaveBeenCalled();
  });

  it("renvoie 404 si le Justificatif n'est pas rattaché à la Note de l'URL", async () => {
    documentFindUniqueMock.mockResolvedValue({ ...document, expenseReportId: "report-2" });

    expect((await call()).status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("sert le fichier en inline avec son type MIME", async () => {
    const response = await call();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(response.headers.get("Content-Disposition")).toBe(
      'inline; filename="facture.jpg"',
    );
  });
});
