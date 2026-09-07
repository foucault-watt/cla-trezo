import { describe, expect, it } from "vitest";
import { buildExpenseReportPdfFilename } from "./expense-report-pdf-filename";

describe("buildExpenseReportPdfFilename", () => {
  it("nomme le PDF Solde sans référence à une Subvention, avec le bénéficiaire", () => {
    expect(
      buildExpenseReportPdfFilename({
        fundingSource: "CLUB_BALANCE",
        subvention: null,
        expenseReport: {
          beneficiaryFirstname: "Jean",
          beneficiaryLastname: "Dupont",
        },
      }),
    ).toBe("note-de-frais-solde-jean-dupont.pdf");
  });

  it("slugifie la raison de la Subvention et le bénéficiaire pour un PDF Subvention", () => {
    expect(
      buildExpenseReportPdfFilename({
        fundingSource: "SUBVENTION",
        subvention: { reason: "Achat de materiel 2026" },
        expenseReport: {
          beneficiaryFirstname: "Jean",
          beneficiaryLastname: "Dupont",
        },
      }),
    ).toBe("note-de-frais-achat-de-materiel-2026-jean-dupont.pdf");
  });

  it("retombe sur 'subvention' si la raison est absente", () => {
    expect(
      buildExpenseReportPdfFilename({
        fundingSource: "SUBVENTION",
        subvention: null,
        expenseReport: {
          beneficiaryFirstname: "Jean",
          beneficiaryLastname: "Dupont",
        },
      }),
    ).toBe("note-de-frais-subvention-jean-dupont.pdf");
  });

  it("enlève les accents du nom du bénéficiaire et de la raison", () => {
    expect(
      buildExpenseReportPdfFilename({
        fundingSource: "SUBVENTION",
        subvention: { reason: "Réparation vélo" },
        expenseReport: {
          beneficiaryFirstname: "Éric",
          beneficiaryLastname: "Béranger",
        },
      }),
    ).toBe("note-de-frais-reparation-velo-eric-beranger.pdf");
  });

  it("omet le suffixe bénéficiaire si le nom n'est pas renseigné", () => {
    expect(
      buildExpenseReportPdfFilename({
        fundingSource: "CLUB_BALANCE",
        subvention: null,
        expenseReport: {
          beneficiaryFirstname: null,
          beneficiaryLastname: null,
        },
      }),
    ).toBe("note-de-frais-solde.pdf");
  });
});
