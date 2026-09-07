import { describe, expect, it } from "vitest";
import { buildExpenseReportPdfFilename } from "./expense-report-pdf-filename";

describe("buildExpenseReportPdfFilename", () => {
  it("nomme le PDF Solde sans référence à une Subvention", () => {
    expect(
      buildExpenseReportPdfFilename({
        fundingSource: "CLUB_BALANCE",
        subvention: null,
      }),
    ).toBe("note-de-frais-solde.pdf");
  });

  it("slugifie la raison de la Subvention pour un PDF Subvention", () => {
    expect(
      buildExpenseReportPdfFilename({
        fundingSource: "SUBVENTION",
        subvention: { reason: "Achat de materiel 2026" },
      }),
    ).toBe("note-de-frais-achat-de-materiel-2026.pdf");
  });

  it("retombe sur 'subvention' si la raison est absente", () => {
    expect(
      buildExpenseReportPdfFilename({
        fundingSource: "SUBVENTION",
        subvention: null,
      }),
    ).toBe("note-de-frais-subvention.pdf");
  });
});
