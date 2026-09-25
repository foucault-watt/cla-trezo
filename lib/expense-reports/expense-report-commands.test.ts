import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ExpenseReportActor } from "./expense-report-lifecycle";

const mocks = vi.hoisted(() => ({
  reportFindUnique: vi.fn(),
  reportUpdate: vi.fn(),
  lineFindUnique: vi.fn(),
  lineCreate: vi.fn(),
  lineUpdate: vi.fn(),
  lineDelete: vi.fn(),
  documentFindUnique: vi.fn(),
  membershipFindFirst: vi.fn(),
  revalidatePath: vi.fn(),
  eligibility: vi.fn(),
  warnings: vi.fn(),
  addDocumentsCore: vi.fn(),
  removeDocumentCore: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseReport: {
      findUnique: mocks.reportFindUnique,
      update: mocks.reportUpdate,
    },
    expenseReportLine: {
      findUnique: mocks.lineFindUnique,
      create: mocks.lineCreate,
      update: mocks.lineUpdate,
      delete: mocks.lineDelete,
    },
    supportingDocument: { findUnique: mocks.documentFindUnique },
    refAssoUser: { findFirst: mocks.membershipFindFirst },
  },
}));
vi.mock("./expense-report-line-shared", () => ({
  loadFundingSourceEligibility: mocks.eligibility,
}));
vi.mock("./line-warnings", () => ({
  loadExpenseLineWarnings: mocks.warnings,
}));
vi.mock("./supporting-document-shared", () => ({
  addSupportingDocumentsCore: mocks.addDocumentsCore,
  removeSupportingDocumentCore: mocks.removeDocumentCore,
}));

const {
  updateExpenseReportInfo,
  updateExpenseReportBeneficiary,
  addExpenseReportLine,
  updateExpenseReportLine,
  deleteExpenseReportLine,
  addExpenseReportDocuments,
  removeExpenseReportDocument,
} = await import("./expense-report-commands");

const REPORT_ID = "11111111-1111-4111-8111-111111111111";
const LINE_ID = "22222222-2222-4222-8222-222222222222";

const structure: ExpenseReportActor = { type: "STRUCTURE", assoId: "asso-1" };
const admin: ExpenseReportActor = { type: "ADMIN" };

function report(overrides: Record<string, unknown> = {}) {
  return {
    id: REPORT_ID,
    assoId: "asso-1",
    status: "DRAFT",
    asso: { slug: "club-info" },
    beneficiaryUserId: null,
    beneficiaryFirstname: null,
    beneficiaryLastname: null,
    beneficiaryIban: null,
    ...overrides,
  };
}

const line = {
  expenseDate: new Date("2026-09-01T00:00:00.000Z"),
  amount: 12.5,
  expenseName: "Pizzas",
  typeDepenseId: null,
  customLabel: null,
  fundingSource: "CLUB_BALANCE" as const,
  subventionId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.reportFindUnique.mockResolvedValue(report());
  mocks.eligibility.mockResolvedValue({ ok: true });
  mocks.warnings.mockResolvedValue(["Solde négatif"]);
  mocks.addDocumentsCore.mockResolvedValue({ ok: true });
});

describe("verrouillage et visibilité (ADR-0001)", () => {
  const info = { id: REPORT_ID, title: "Soirée", description: null };

  it.each([
    ["STRUCTURE", structure, "DRAFT"],
    ["STRUCTURE", structure, "SUBMITTED"],
    ["ADMIN", admin, "TAKEN_OVER"],
  ] as const)("laisse %s modifier une Note %s", async (_label, actor, status) => {
    mocks.reportFindUnique.mockResolvedValue(report({ status }));

    expect(await updateExpenseReportInfo(actor, info)).toEqual({ ok: true });
    expect(mocks.reportUpdate).toHaveBeenCalledWith({
      where: { id: REPORT_ID },
      data: { title: "Soirée", description: null },
    });
  });

  it.each([
    ["STRUCTURE", structure, "TAKEN_OVER"],
    ["STRUCTURE", structure, "FINALIZED"],
    ["ADMIN", admin, "SUBMITTED"],
    ["ADMIN", admin, "FINALIZED"],
  ] as const)("refuse à %s une Note %s", async (_label, actor, status) => {
    mocks.reportFindUnique.mockResolvedValue(report({ status }));

    expect(await updateExpenseReportInfo(actor, info)).toEqual({
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
    });
    expect(mocks.reportUpdate).not.toHaveBeenCalled();
  });

  it("traite la Note d'une autre Structure comme introuvable", async () => {
    mocks.reportFindUnique.mockResolvedValue(report({ assoId: "asso-2" }));

    expect(await updateExpenseReportInfo(structure, info)).toEqual({
      ok: false,
      error: "Note de frais introuvable.",
    });
    expect(mocks.reportUpdate).not.toHaveBeenCalled();
  });

  it("laisse l'Admin atteindre la Note de n'importe quelle Structure", async () => {
    mocks.reportFindUnique.mockResolvedValue(
      report({ assoId: "asso-2", status: "TAKEN_OVER" }),
    );

    expect(await updateExpenseReportInfo(admin, info)).toEqual({ ok: true });
  });

  it("rafraîchit la Note dans les deux espaces", async () => {
    await updateExpenseReportInfo(structure, info);

    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/app/[assoSlug]/notes-de-frais",
      "layout",
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith(
      "/app/admin/notes-de-frais",
      "layout",
    );
  });
});

describe("updateExpenseReportBeneficiary", () => {
  const member = {
    userId: "user-1",
    user: { firstname: "Jean", lastname: "Dupont" },
  };

  it("garde l'IBAN existant si le bénéficiaire n'a pas changé", async () => {
    mocks.reportFindUnique.mockResolvedValue(
      report({ beneficiaryUserId: "user-1", beneficiaryIban: "FR7630006000011234567890189" }),
    );
    mocks.membershipFindFirst.mockResolvedValue(member);

    const result = await updateExpenseReportBeneficiary(structure, {
      id: REPORT_ID,
      beneficiaryKind: "MEMBER",
      beneficiaryUserId: "user-1",
      beneficiaryFirstname: "",
      beneficiaryLastname: "",
      beneficiaryIban: "",
    });

    expect(result).toEqual({ ok: true });
    expect(mocks.reportUpdate).toHaveBeenCalledWith({
      where: { id: REPORT_ID },
      data: {
        beneficiaryUserId: "user-1",
        beneficiaryFirstname: "Jean",
        beneficiaryLastname: "Dupont",
        beneficiaryIban: "FR7630006000011234567890189",
      },
    });
  });

  it("exige un IBAN pour un nouveau bénéficiaire", async () => {
    mocks.reportFindUnique.mockResolvedValue(
      report({ beneficiaryUserId: "user-2", beneficiaryIban: "FR7630006000011234567890189" }),
    );
    mocks.membershipFindFirst.mockResolvedValue(member);

    const result = await updateExpenseReportBeneficiary(structure, {
      id: REPORT_ID,
      beneficiaryKind: "MEMBER",
      beneficiaryUserId: "user-1",
      beneficiaryFirstname: "",
      beneficiaryLastname: "",
      beneficiaryIban: "",
    });

    expect(result).toEqual({
      ok: false,
      error: "Renseignez l'IBAN du nouveau bénéficiaire.",
    });
    expect(mocks.reportUpdate).not.toHaveBeenCalled();
  });

  it("cherche le membre dans la Structure de la Note, y compris pour l'Admin", async () => {
    mocks.reportFindUnique.mockResolvedValue(
      report({ assoId: "asso-2", status: "TAKEN_OVER" }),
    );
    mocks.membershipFindFirst.mockResolvedValue(null);

    const result = await updateExpenseReportBeneficiary(admin, {
      id: REPORT_ID,
      beneficiaryKind: "MEMBER",
      beneficiaryUserId: "user-1",
      beneficiaryFirstname: "",
      beneficiaryLastname: "",
      beneficiaryIban: "FR7630006000011234567890189",
    });

    expect(mocks.membershipFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assoId: "asso-2", userId: "user-1", isActive: true },
      }),
    );
    expect(result).toEqual({ ok: false, error: "Membre introuvable ou inactif." });
  });
});

describe("Remboursements", () => {
  it("crée le Remboursement en centimes et renvoie les Warnings", async () => {
    const result = await addExpenseReportLine(structure, {
      expenseReportId: REPORT_ID,
      ...line,
    });

    expect(result).toEqual({ ok: true, warnings: ["Solde négatif"] });
    expect(mocks.lineCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        expenseReportId: REPORT_ID,
        amountCents: 1250,
        expenseName: "Pizzas",
      }),
    });
  });

  it("vérifie l'éligibilité sur la Structure de la Note, sans passe-droit Admin", async () => {
    mocks.reportFindUnique.mockResolvedValue(
      report({ assoId: "asso-2", status: "TAKEN_OVER" }),
    );
    mocks.eligibility.mockResolvedValue({
      ok: false,
      error: "Seul un Club dispose d'un Solde.",
    });

    const result = await addExpenseReportLine(admin, {
      expenseReportId: REPORT_ID,
      ...line,
    });

    expect(mocks.eligibility).toHaveBeenCalledWith(
      expect.objectContaining({ assoId: "asso-2" }),
    );
    expect(result).toEqual({ ok: false, error: "Seul un Club dispose d'un Solde." });
    expect(mocks.lineCreate).not.toHaveBeenCalled();
  });

  it("exclut le Remboursement modifié du calcul des Warnings", async () => {
    mocks.lineFindUnique.mockResolvedValue({ id: LINE_ID, expenseReport: report() });

    await updateExpenseReportLine(structure, { id: LINE_ID, ...line });

    expect(mocks.warnings).toHaveBeenCalledWith(
      expect.objectContaining({ excludeLineId: LINE_ID, expenseReportId: REPORT_ID }),
    );
    expect(mocks.lineUpdate).toHaveBeenCalledWith({
      where: { id: LINE_ID },
      data: expect.objectContaining({ amountCents: 1250 }),
    });
  });

  it("traite un Remboursement d'une autre Structure comme introuvable", async () => {
    mocks.lineFindUnique.mockResolvedValue({
      id: LINE_ID,
      expenseReport: report({ assoId: "asso-2" }),
    });

    expect(await updateExpenseReportLine(structure, { id: LINE_ID, ...line })).toEqual({
      ok: false,
      error: "Remboursement introuvable.",
    });
    expect(await deleteExpenseReportLine(structure, { id: LINE_ID })).toEqual({
      ok: false,
      error: "Remboursement introuvable.",
    });
    expect(mocks.lineUpdate).not.toHaveBeenCalled();
    expect(mocks.lineDelete).not.toHaveBeenCalled();
  });

  it("refuse à l'Admin de supprimer un Remboursement avant la Prise en charge", async () => {
    mocks.lineFindUnique.mockResolvedValue({
      id: LINE_ID,
      expenseReport: report({ status: "SUBMITTED" }),
    });

    expect(await deleteExpenseReportLine(admin, { id: LINE_ID })).toEqual({
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
    });
    expect(await deleteExpenseReportLine(structure, { id: LINE_ID })).toEqual({ ok: true });
    expect(mocks.lineDelete).toHaveBeenCalledTimes(1);
  });
});

describe("Justificatifs", () => {
  it("dépose les fichiers sous la Structure de la Note", async () => {
    const files = [new File(["x"], "ticket.png")];

    const result = await addExpenseReportDocuments(structure, {
      expenseReportId: REPORT_ID,
      documentType: "RECEIPT",
      files,
    });

    expect(result).toEqual({ ok: true });
    expect(mocks.addDocumentsCore).toHaveBeenCalledWith({
      report: { id: REPORT_ID, assoSlug: "club-info" },
      documentType: "RECEIPT",
      files,
    });
  });

  it("remonte le refus de la règle d'exclusivité sans rafraîchir", async () => {
    mocks.addDocumentsCore.mockResolvedValue({
      ok: false,
      error: "Une Attestation sur l'honneur est déjà présente.",
    });

    const result = await addExpenseReportDocuments(structure, {
      expenseReportId: REPORT_ID,
      documentType: "RECEIPT",
      files: [],
    });

    expect(result).toEqual({
      ok: false,
      error: "Une Attestation sur l'honneur est déjà présente.",
    });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("traite un Justificatif d'une autre Structure comme introuvable", async () => {
    mocks.documentFindUnique.mockResolvedValue({
      id: "doc-1",
      filePath: "bde/doc.pdf",
      expenseReport: report({ assoId: "asso-2" }),
    });

    expect(await removeExpenseReportDocument(structure, { id: "doc-1" })).toEqual({
      ok: false,
      error: "Justificatif introuvable.",
    });
    expect(mocks.removeDocumentCore).not.toHaveBeenCalled();
  });

  it("supprime le Justificatif d'une Note modifiable", async () => {
    const document = {
      id: "doc-1",
      filePath: "club-info/doc.pdf",
      expenseReport: report(),
    };
    mocks.documentFindUnique.mockResolvedValue(document);

    expect(await removeExpenseReportDocument(structure, { id: "doc-1" })).toEqual({ ok: true });
    expect(mocks.removeDocumentCore).toHaveBeenCalledWith(document);
  });
});
