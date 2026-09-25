import { describe, it, expect, vi, beforeEach } from "vitest";

// Accès, 410 et en-têtes : cf. lib/storage/stored-file-route.test.ts.
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

const member = {
  id: "user-1",
  isAdmin: false,
  structures: [
    { assoId: "asso-1", slug: "club-info", name: "Club Info", role: "Trésorier" },
  ],
};

const pdf = {
  filePath: "club-info/report-1/final.pdf",
  expenseReportId: "report-1",
  fundingSource: "CLUB_BALANCE",
  subvention: null,
  expenseReport: {
    assoId: "asso-1",
    beneficiaryFirstname: "Jean",
    beneficiaryLastname: "Dupont",
  },
};

function call() {
  return GET(new Request("http://localhost"), {
    params: Promise.resolve({
      assoSlug: "club-info",
      reportId: "report-1",
      pdfId: "pdf-1",
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: member });
  pdfFindUniqueMock.mockResolvedValue(pdf);
  readStoredFileMock.mockResolvedValue(Buffer.from("%PDF-1.4"));
});

describe("GET PDF final (Structure)", () => {
  it("renvoie 404 si le PDF appartient à une Note d'une autre Structure", async () => {
    pdfFindUniqueMock.mockResolvedValue({
      ...pdf,
      expenseReport: { ...pdf.expenseReport, assoId: "asso-2" },
    });

    expect((await call()).status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("renvoie 404 si le PDF n'est pas rattaché à la Note de l'URL", async () => {
    pdfFindUniqueMock.mockResolvedValue({ ...pdf, expenseReportId: "report-2" });

    expect((await call()).status).toBe(404);
    expect(readStoredFileMock).not.toHaveBeenCalled();
  });

  it("sert le PDF en pièce jointe avec un nom incluant le bénéficiaire", async () => {
    const response = await call();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="note-de-frais-solde-jean-dupont\.pdf"/,
    );
  });
});
