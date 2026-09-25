import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  getSessionMock,
  assoFindUniqueMock,
  findGrantDocumentForAssoMock,
  readStoredFileMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  assoFindUniqueMock: vi.fn(),
  findGrantDocumentForAssoMock: vi.fn(),
  readStoredFileMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { asso: { findUnique: assoFindUniqueMock } },
}));
vi.mock("@/lib/storage/file-storage", () => ({
  readStoredFile: readStoredFileMock,
}));
vi.mock("@/lib/subventions/grant-documents", () => ({
  findGrantDocumentForAsso: findGrantDocumentForAssoMock,
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

function call(params = { assoSlug: "club-info", documentId: "grant-1" }) {
  return GET(new Request("http://localhost"), { params: Promise.resolve(params) });
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
  it("renvoie 401 sans session", async () => {
    getSessionMock.mockResolvedValue({});

    expect((await call()).status).toBe(401);
  });

  it("renvoie 404 à un utilisateur qui n'est pas membre de la Structure", async () => {
    const response = await call({ assoSlug: "bde", documentId: "grant-1" });

    expect(response.status).toBe(404);
    expect(findGrantDocumentForAssoMock).not.toHaveBeenCalled();
  });

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
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="convention-club-info.pdf"',
    );
  });
});
