import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionMock, pdfFindUniqueMock, readStoredFileMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  pdfFindUniqueMock: vi.fn(),
  readStoredFileMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: { expenseReportPdf: { findUnique: pdfFindUniqueMock } },
}));
vi.mock("@/lib/storage/file-storage", () => ({
  readStoredFile: readStoredFileMock,
}));

const { GET } = await import("./route");

const admin = { id: "admin-1", isAdmin: true, structures: [] };

const pdf = {
  filePath: "club-info/report-1/final.pdf",
  expenseReportId: "report-1",
  fundingSource: "SUBVENTION",
  subvention: { reason: "Week-end d'intégration" },
  expenseReport: { beneficiaryFirstname: "Jean", beneficiaryLastname: "Dupont" },
};

function call(params = { reportId: "report-1", pdfId: "pdf-1" }) {
  return GET(new Request("http://localhost"), { params: Promise.resolve(params) });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: admin });
  pdfFindUniqueMock.mockResolvedValue(pdf);
  readStoredFileMock.mockResolvedValue(Buffer.from("%PDF-1.4"));
});

describe("GET PDF final (Admin)", () => {
  it("renvoie 401 sans session", async () => {
    getSessionMock.mockResolvedValue({});

    expect((await call()).status).toBe(401);
  });

  it("renvoie 404 à un non-Admin, même membre de la Structure", async () => {
    getSessionMock.mockResolvedValue({
      user: {
        ...admin,
        isAdmin: false,
        structures: [{ assoId: "asso-1", slug: "club-info", name: "Club Info", role: "Président" }],
      },
    });

    const response = await call();

    expect(response.status).toBe(404);
    expect(pdfFindUniqueMock).not.toHaveBeenCalled();
  });

  it("renvoie 404 si le PDF n'est pas rattaché à la Note de l'URL", async () => {
    pdfFindUniqueMock.mockResolvedValue({ ...pdf, expenseReportId: "report-2" });

    expect((await call()).status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("renvoie 410 si le PDF est référencé en base mais absent du disque", async () => {
    readStoredFileMock.mockRejectedValue(
      Object.assign(new Error("absent"), { code: "ENOENT" }),
    );

    expect((await call()).status).toBe(410);
  });

  it("propage les autres erreurs de lecture", async () => {
    readStoredFileMock.mockRejectedValue(
      Object.assign(new Error("permission"), { code: "EACCES" }),
    );

    await expect(call()).rejects.toThrow("permission");
  });

  it("sert le PDF avec un nom dérivé du motif de la Subvention", async () => {
    const response = await call();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="note-de-frais-week-end-d-integration-jean-dupont.pdf"',
    );
  });
});
