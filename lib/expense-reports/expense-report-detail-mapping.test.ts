import { describe, expect, it } from "vitest";
import {
  mapExpenseReportToDetail,
  type ExpenseReportRow,
} from "./expense-report-detail-mapping";

const REPORT: ExpenseReportRow = {
  id: "report-1",
  title: "Gala 2026",
  description: "Déplacement en car",
  status: "DRAFT",
  createdAt: new Date("2026-01-01"),
  beneficiaryFirstname: "Jean",
  beneficiaryLastname: "Dupont",
  beneficiaryIban: "FR7630006000011234567890189",
  lines: [
    {
      id: "line-1",
      amountCents: 4250,
      expenseName: "Billets de train",
      typeDepenseId: "type-1",
      typeDepense: { label: "Transport" },
      customLabel: null,
      fundingSource: "SUBVENTION",
      subventionId: "sub-1",
      subvention: { reason: "Achat de matériel" },
    },
  ],
  supportingDocuments: [
    {
      id: "doc-1",
      type: "RECEIPT",
      originalFilename: "facture.pdf",
      mimeType: "application/pdf",
      createdAt: new Date("2026-01-02"),
    },
  ],
};

describe("mapExpenseReportToDetail", () => {
  it("inclut l'IBAN de la Note quand includeAdminFields est vrai", () => {
    const result = mapExpenseReportToDetail(REPORT, {
      includeAdminFields: true,
    });

    expect(result.beneficiaryIban).toBe("FR7630006000011234567890189");
  });

  it("masque l'IBAN de la Note quand includeAdminFields est faux", () => {
    const result = mapExpenseReportToDetail(REPORT, {
      includeAdminFields: false,
    });

    expect(result.beneficiaryIban).toBeNull();
    expect(result.beneficiaryIbanLast4).toBe("0189");
  });

  it("mappe les Lignes indépendamment du flag Admin", () => {
    const result = mapExpenseReportToDetail(REPORT, {
      includeAdminFields: false,
    });

    expect(result.lines).toEqual([
      {
        id: "line-1",
        amountCents: 4250,
        expenseDate: null,
        expenseName: "Billets de train",
        typeDepenseId: "type-1",
        typeDepenseLabel: "Transport",
        customLabel: null,
        fundingSource: "SUBVENTION",
        subventionId: "sub-1",
        subventionReason: "Achat de matériel",
        warnings: [],
      },
    ]);
  });

  it("mappe la Note et les Justificatifs indépendamment du flag Admin", () => {
    const result = mapExpenseReportToDetail(REPORT, {
      includeAdminFields: false,
    });

    expect(result).toMatchObject({
      id: "report-1",
      title: "Gala 2026",
      description: "Déplacement en car",
      status: "DRAFT",
      createdAt: new Date("2026-01-01"),
    });
    expect(result.supportingDocuments).toEqual([
      {
        id: "doc-1",
        type: "RECEIPT",
        originalFilename: "facture.pdf",
        mimeType: "application/pdf",
        createdAt: new Date("2026-01-02"),
      },
    ]);
  });
});
