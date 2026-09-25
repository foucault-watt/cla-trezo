import { describe, it, expect, vi, beforeEach } from "vitest";

// Accès, 410 et en-têtes : cf. lib/storage/stored-file-route.test.ts.
const { getSessionMock, findGrantDocumentForAssoMock, readStoredFileMock } =
  vi.hoisted(() => ({
    getSessionMock: vi.fn(),
    findGrantDocumentForAssoMock: vi.fn(),
    readStoredFileMock: vi.fn(),
  }));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
  getDemoSession: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/storage/file-storage", () => ({
  readStoredFile: readStoredFileMock,
}));
vi.mock("@/lib/subventions/grant-documents", () => ({
  findGrantDocumentForAsso: findGrantDocumentForAssoMock,
}));

const { GET } = await import("./route");

const member = {
  id: "user-1",
  isAdmin: false,
  structures: [
    { assoId: "asso-1", slug: "club-info", name: "Club Info", role: "Trésorier" },
  ],
};

function call() {
  return GET(new Request("http://localhost"), {
    params: Promise.resolve({ assoSlug: "club-info", documentId: "grant-1" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: member });
  findGrantDocumentForAssoMock.mockResolvedValue({
    filePath: "club-info/octroi/grant-1.pdf",
    filename: "convention-club-info.pdf",
  });
  readStoredFileMock.mockResolvedValue(Buffer.from("%PDF-1.4"));
});

describe("GET Document d'octroi (Structure)", () => {
  it("cherche le Document scopé à la Structure de la session, pas à l'URL seule", async () => {
    findGrantDocumentForAssoMock.mockResolvedValue(null);

    const response = await call();

    expect(findGrantDocumentForAssoMock).toHaveBeenCalledWith("grant-1", "asso-1");
    expect(response.status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("sert le Document en pièce jointe", async () => {
    const response = await call();

    expect(response.status).toBe(200);
    expect(readStoredFileMock).toHaveBeenCalledWith("club-info/octroi/grant-1.pdf");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="convention-club-info\.pdf"/,
    );
  });
});
