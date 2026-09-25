import { describe, it, expect, vi, beforeEach } from "vitest";

// Accès, 410 et en-têtes : cf. lib/storage/stored-file-route.test.ts.
const { getSessionMock, grantDocumentFindUniqueMock, readStoredFileMock } =
  vi.hoisted(() => ({
    getSessionMock: vi.fn(),
    grantDocumentFindUniqueMock: vi.fn(),
    readStoredFileMock: vi.fn(),
  }));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
  getDemoSession: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { grantDocument: { findUnique: grantDocumentFindUniqueMock } },
}));
vi.mock("@/lib/storage/file-storage", () => ({
  readStoredFile: readStoredFileMock,
}));

const { GET } = await import("./route");

const admin = { id: "admin-1", isAdmin: true, structures: [] };

function call() {
  return GET(new Request("http://localhost"), {
    params: Promise.resolve({ campaignId: "campaign-1", assoId: "asso-1" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: admin });
  grantDocumentFindUniqueMock.mockResolvedValue({
    kind: "CONVENTION",
    filePath: "bde/octroi/campaign-1.pdf",
    asso: { name: "BDE" },
    campaign: { name: "CA Budget 2026" },
  });
  readStoredFileMock.mockResolvedValue(Buffer.from("%PDF-1.4"));
});

describe("GET Document d'octroi (Admin)", () => {
  it("cherche le Document du couple Campagne × Structure de l'URL", async () => {
    grantDocumentFindUniqueMock.mockResolvedValue(null);

    const response = await call();

    expect(grantDocumentFindUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { campaignId_assoId: { campaignId: "campaign-1", assoId: "asso-1" } },
      }),
    );
    expect(response.status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("sert le Document en pièce jointe, nommé selon son type", async () => {
    const response = await call();

    expect(response.status).toBe(200);
    expect(readStoredFileMock).toHaveBeenCalledWith("bde/octroi/campaign-1.pdf");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="convention-de-subvention-bde-ca-budget-2026\.pdf"/,
    );
  });
});
