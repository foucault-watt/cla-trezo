import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  getSessionMock,
  getDemoSessionMock,
  assoFindUniqueMock,
  readStoredFileMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  getDemoSessionMock: vi.fn(),
  assoFindUniqueMock: vi.fn(),
  readStoredFileMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
  getDemoSession: getDemoSessionMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { asso: { findUnique: assoFindUniqueMock } },
}));
vi.mock("@/lib/storage/file-storage", () => ({
  readStoredFile: readStoredFileMock,
}));

const { structureFileRoute, adminFileRoute } = await import(
  "./stored-file-route"
);

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
const admin = { ...member, id: "admin-1", isAdmin: true, structures: [] };
const demoUser = {
  ...member,
  id: "user-demo",
  isDemo: true,
  structures: [
    { assoId: "asso-demo", slug: "club-demo", name: "Club Démo", role: "Trésorier" },
  ],
};

const storedFile = {
  filePath: "club-info/report-1/doc.pdf",
  mimeType: "application/pdf",
  filename: "ticket de caisse été.pdf",
  disposition: "inline" as const,
};

const resolver = vi.fn();

function callStructure(params: { assoSlug: string; id: string }) {
  const GET = structureFileRoute<{ assoSlug: string; id: string }>(resolver);
  return GET(new Request("http://localhost"), {
    params: Promise.resolve(params),
  });
}

function callAdmin(params = { id: "doc-1" }) {
  const GET = adminFileRoute<{ id: string }>(resolver);
  return GET(new Request("http://localhost"), {
    params: Promise.resolve(params),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: member });
  getDemoSessionMock.mockResolvedValue({});
  resolver.mockResolvedValue(storedFile);
  readStoredFileMock.mockResolvedValue(Buffer.from("%PDF-1.4"));
});

describe("structureFileRoute — accès", () => {
  it("renvoie 401 sans session", async () => {
    getSessionMock.mockResolvedValue({});

    const response = await callStructure({ assoSlug: "club-info", id: "doc-1" });

    expect(response.status).toBe(401);
    expect(resolver).not.toHaveBeenCalled();
  });

  it("renvoie 404 à un non-membre de la Structure", async () => {
    const response = await callStructure({ assoSlug: "bde", id: "doc-1" });

    expect(response.status).toBe(404);
    expect(resolver).not.toHaveBeenCalled();
  });

  it("passe au resolver les params résolus et la Structure du membre", async () => {
    const response = await callStructure({ assoSlug: "club-info", id: "doc-1" });

    expect(response.status).toBe(200);
    expect(resolver).toHaveBeenCalledWith({
      params: { assoSlug: "club-info", id: "doc-1" },
      structure: { assoId: "asso-1", slug: "club-info", name: "Club Info", role: "Trésorier" },
    });
  });

  it("laisse un Admin non membre accéder à toute Structure existante", async () => {
    getSessionMock.mockResolvedValue({ user: admin });
    assoFindUniqueMock.mockResolvedValue({ id: "asso-1", name: "Club Info" });

    const response = await callStructure({ assoSlug: "club-info", id: "doc-1" });

    expect(response.status).toBe(200);
  });

  it("sert les fichiers de l'Asso démo via le cookie démo", async () => {
    getSessionMock.mockResolvedValue({});
    getDemoSessionMock.mockResolvedValue({ user: demoUser });

    const response = await callStructure({ assoSlug: "club-demo", id: "doc-1" });

    expect(response.status).toBe(200);
    expect(resolver).toHaveBeenCalledWith(
      expect.objectContaining({
        structure: expect.objectContaining({ assoId: "asso-demo" }),
      }),
    );
  });

  it("refuse l'Asso démo à la vraie session, même Admin, sans cookie démo", async () => {
    getSessionMock.mockResolvedValue({ user: admin });
    assoFindUniqueMock.mockResolvedValue({ id: "asso-demo", name: "Club Démo" });

    const response = await callStructure({ assoSlug: "club-demo", id: "doc-1" });

    expect(response.status).toBe(401);
    expect(resolver).not.toHaveBeenCalled();
  });
});

describe("adminFileRoute — accès", () => {
  it("renvoie 401 sans session", async () => {
    getSessionMock.mockResolvedValue({});

    expect((await callAdmin()).status).toBe(401);
    expect(resolver).not.toHaveBeenCalled();
  });

  it("renvoie 404 à un non-Admin", async () => {
    expect((await callAdmin()).status).toBe(404);
    expect(resolver).not.toHaveBeenCalled();
  });

  it("passe au resolver les params résolus et l'Admin", async () => {
    getSessionMock.mockResolvedValue({ user: admin });

    const response = await callAdmin();

    expect(response.status).toBe(200);
    expect(resolver).toHaveBeenCalledWith({ params: { id: "doc-1" }, user: admin });
  });
});

describe("réponse fichier", () => {
  it("renvoie 404 si le resolver ne trouve pas de fichier servable", async () => {
    resolver.mockResolvedValue(null);

    const response = await callStructure({ assoSlug: "club-info", id: "doc-1" });

    expect(response.status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("sert le contenu avec son type MIME, sans cache partagé", async () => {
    const response = await callStructure({ assoSlug: "club-info", id: "doc-1" });

    expect(readStoredFileMock).toHaveBeenCalledWith(storedFile.filePath);
    expect(await response.text()).toBe("%PDF-1.4");
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Cache-Control")).toBe(
      "private, max-age=0, no-cache",
    );
  });

  it("encode le nom de fichier en ASCII de repli et en UTF-8 (RFC 6266)", async () => {
    const response = await callStructure({ assoSlug: "club-info", id: "doc-1" });

    expect(response.headers.get("Content-Disposition")).toBe(
      `inline; filename="ticket de caisse ete.pdf"; filename*=UTF-8''ticket%20de%20caisse%20%C3%A9t%C3%A9.pdf`,
    );
  });

  it("neutralise guillemets et barres obliques inverses dans le nom de repli", async () => {
    resolver.mockResolvedValue({
      ...storedFile,
      filename: 'devis "final"\\v2.pdf',
      disposition: "attachment",
    });

    const response = await callStructure({ assoSlug: "club-info", id: "doc-1" });

    expect(response.headers.get("Content-Disposition")).toBe(
      `attachment; filename="devis _final__v2.pdf"; filename*=UTF-8''devis%20%22final%22%5Cv2.pdf`,
    );
  });

  it("renvoie 410 avec un message si le fichier référencé a disparu du disque", async () => {
    readStoredFileMock.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );

    const response = await callStructure({ assoSlug: "club-info", id: "doc-1" });

    expect(response.status).toBe(410);
    expect(await response.text()).toContain("plus disponible");
  });

  it("laisse remonter toute autre erreur de lecture", async () => {
    readStoredFileMock.mockRejectedValue(new Error("EACCES"));

    await expect(
      callStructure({ assoSlug: "club-info", id: "doc-1" }),
    ).rejects.toThrow("EACCES");
  });
});
