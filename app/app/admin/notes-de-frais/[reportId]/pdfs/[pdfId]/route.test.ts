import { describe, it, expect, vi, beforeEach } from "vitest";

// Accès, 410 (reconstitution) et en-têtes : cf.
// lib/storage/stored-file-route.test.ts.
const { getSessionMock, pdfFindUniqueMock, readStoredFileMock } = vi.hoisted(
  () => ({
    getSessionMock: vi.fn(),
    pdfFindUniqueMock: vi.fn(),
    readStoredFileMock: vi.fn(),
  }),
);

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
  getDemoSession: vi.fn(),
}));
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

function call() {
  return GET(new Request("http://localhost"), {
    params: Promise.resolve({ reportId: "report-1", pdfId: "pdf-1" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: admin });
  pdfFindUniqueMock.mockResolvedValue(pdf);
  readStoredFileMock.mockResolvedValue(Buffer.from("%PDF-1.4"));
});

describe("GET PDF final (Admin)", () => {
  it("renvoie 404 si le PDF n'est pas rattaché à la Note de l'URL", async () => {
    pdfFindUniqueMock.mockResolvedValue({ ...pdf, expenseReportId: "report-2" });

    expect((await call()).status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("sert le PDF avec un nom dérivé du motif de la Subvention", async () => {
    const response = await call();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="note-de-frais-week-end-d-integration-jean-dupont\.pdf"/,
    );
  });
});
