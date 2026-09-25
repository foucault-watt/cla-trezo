import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  getSessionMock,
  assoFindUniqueMock,
  documentFindUniqueMock,
  readStoredFileMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  assoFindUniqueMock: vi.fn(),
  documentFindUniqueMock: vi.fn(),
  readStoredFileMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    asso: { findUnique: assoFindUniqueMock },
    supportingDocument: { findUnique: documentFindUniqueMock },
  },
}));
vi.mock("@/lib/storage/file-storage", () => ({
  readStoredFile: readStoredFileMock,
}));

const { GET } = await import("./route");

const member = {
  id: "user-1",
  username: "jdupont",
  firstname: "Jean",
  lastname: "Dupont",
  isAdmin: false,
  structures: [
    { assoId: "asso-1", slug: "club-info", name: "Club Info", role: "Trésorier" },
  ],
};

const document = {
  filePath: "club-info/report-1/doc.pdf",
  mimeType: "application/pdf",
  originalFilename: "ticket de caisse.pdf",
  expenseReportId: "report-1",
  expenseReport: { assoId: "asso-1" },
};

function call(params = { assoSlug: "club-info", reportId: "report-1", documentId: "doc-1" }) {
  return GET(new Request("http://localhost"), { params: Promise.resolve(params) });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: member });
  documentFindUniqueMock.mockResolvedValue(document);
  readStoredFileMock.mockResolvedValue(Buffer.from("%PDF-1.4"));
});

describe("GET justificatif (Structure)", () => {
  it("renvoie 401 sans session", async () => {
    getSessionMock.mockResolvedValue({});

    const response = await call();

    expect(response.status).toBe(401);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("renvoie 404 à un utilisateur qui n'est pas membre de la Structure", async () => {
    const response = await call({
      assoSlug: "bde",
      reportId: "report-1",
      documentId: "doc-1",
    });

    expect(response.status).toBe(404);
    expect(documentFindUniqueMock).not.toHaveBeenCalled();
  });

  it("renvoie 404 si le Justificatif appartient à une Note d'une autre Structure", async () => {
    documentFindUniqueMock.mockResolvedValue({
      ...document,
      expenseReport: { assoId: "asso-2" },
    });

    const response = await call();

    expect(response.status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("renvoie 404 si le Justificatif n'est pas rattaché à la Note de l'URL", async () => {
    documentFindUniqueMock.mockResolvedValue({
      ...document,
      expenseReportId: "report-2",
    });

    const response = await call();

    expect(response.status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("renvoie 404 si le Justificatif est introuvable", async () => {
    documentFindUniqueMock.mockResolvedValue(null);

    const response = await call();

    expect(response.status).toBe(404);
  });

  it("sert le fichier en inline avec son type MIME et son nom encodé", async () => {
    const response = await call();

    expect(response.status).toBe(200);
    expect(readStoredFileMock).toHaveBeenCalledWith(document.filePath);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'inline; filename="ticket%20de%20caisse.pdf"',
    );
    expect(response.headers.get("Cache-Control")).toContain("private");
  });

  it("laisse un Admin non membre accéder à toute Structure existante", async () => {
    getSessionMock.mockResolvedValue({
      user: { ...member, isAdmin: true, structures: [] },
    });
    assoFindUniqueMock.mockResolvedValue({ id: "asso-1", name: "Club Info" });

    const response = await call();

    expect(response.status).toBe(200);
  });
});
