import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionMock, assoFindUniqueMock, pdfFindUniqueMock, readStoredFileMock } =
  vi.hoisted(() => ({
    getSessionMock: vi.fn(),
    assoFindUniqueMock: vi.fn(),
    pdfFindUniqueMock: vi.fn(),
    readStoredFileMock: vi.fn(),
  }));

vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    asso: { findUnique: assoFindUniqueMock },
    expenseReportPdf: { findUnique: pdfFindUniqueMock },
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

function call(params = { assoSlug: "club-info", reportId: "report-1", pdfId: "pdf-1" }) {
  return GET(new Request("http://localhost"), { params: Promise.resolve(params) });
}

beforeEach(() => {
  vi.clearAllMocks();
  getSessionMock.mockResolvedValue({ user: member });
  pdfFindUniqueMock.mockResolvedValue(pdf);
  readStoredFileMock.mockResolvedValue(Buffer.from("%PDF-1.4"));
});

describe("GET PDF final (Structure)", () => {
  it("renvoie 401 sans session", async () => {
    getSessionMock.mockResolvedValue({});

    expect((await call()).status).toBe(401);
  });

  it("renvoie 404 à un utilisateur qui n'est pas membre de la Structure", async () => {
    const response = await call({ assoSlug: "bde", reportId: "report-1", pdfId: "pdf-1" });

    expect(response.status).toBe(404);
    expect(pdfFindUniqueMock).not.toHaveBeenCalled();
  });

  it("renvoie 404 si le PDF appartient à une Note d'une autre Structure", async () => {
    pdfFindUniqueMock.mockResolvedValue({
      ...pdf,
      expenseReport: { ...pdf.expenseReport, assoId: "asso-2" },
    });

    const response = await call();

    expect(response.status).toBe(404);
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
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="note-de-frais-solde-jean-dupont.pdf"',
    );
  });
});
