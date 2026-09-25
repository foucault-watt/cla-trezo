import { describe, it, expect, vi, beforeEach } from "vitest";

// Accès, 410 et en-têtes sont testés une fois dans
// lib/storage/stored-file-route.test.ts : ici, seulement ce qui est propre à
// la route (rattachement du Justificatif à la Note et à la Structure).
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

const member = {
  id: "user-1",
  isAdmin: false,
  structures: [
    { assoId: "asso-1", slug: "club-info", name: "Club Info", role: "Trésorier" },
  ],
};

const document = {
  filePath: "club-info/report-1/doc.pdf",
  mimeType: "image/png",
  originalFilename: "ticket.png",
  expenseReportId: "report-1",
  expenseReport: { assoId: "asso-1" },
};

function call() {
  return GET(new Request("http://localhost"), {
    params: Promise.resolve({
      assoSlug: "club-info",
      reportId: "report-1",
      documentId: "doc-1",
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: member });
  documentFindUniqueMock.mockResolvedValue(document);
  readStoredFileMock.mockResolvedValue(Buffer.from("PNG"));
});

describe("GET justificatif (Structure)", () => {
  it("renvoie 404 si le Justificatif appartient à une Note d'une autre Structure", async () => {
    documentFindUniqueMock.mockResolvedValue({
      ...document,
      expenseReport: { assoId: "asso-2" },
    });

    expect((await call()).status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("renvoie 404 si le Justificatif n'est pas rattaché à la Note de l'URL", async () => {
    documentFindUniqueMock.mockResolvedValue({ ...document, expenseReportId: "report-2" });

    expect((await call()).status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("renvoie 404 si le Justificatif est introuvable", async () => {
    documentFindUniqueMock.mockResolvedValue(null);

    expect((await call()).status).toBe(404);
  });

  it("sert le fichier en inline avec son type MIME et son nom d'origine", async () => {
    const response = await call();

    expect(response.status).toBe(200);
    expect(readStoredFileMock).toHaveBeenCalledWith(document.filePath);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^inline; filename="ticket\.png"/,
    );
  });
});
