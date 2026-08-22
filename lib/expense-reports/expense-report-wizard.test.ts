import { describe, expect, it } from "vitest";
import { firstIncompleteExpenseReportStep } from "./expense-report-steps";
import { computeExpenseReportStepCompletion } from "./expense-report-wizard";

function report({
  lines = [],
  supportingDocuments = [],
  beneficiaryFirstname = null,
  beneficiaryLastname = null,
  beneficiaryIbanLast4 = null,
}: Partial<Parameters<typeof computeExpenseReportStepCompletion>[0]> = {}) {
  return {
    lines,
    supportingDocuments,
    beneficiaryFirstname,
    beneficiaryLastname,
    beneficiaryIbanLast4,
  };
}

describe("computeExpenseReportStepCompletion", () => {
  it("regroupe les dépenses et justificatifs dans la première étape", () => {
    expect(
      computeExpenseReportStepCompletion(
        report({ lines: [{ expenseDate: new Date("2026-08-22") }] }),
      ).remboursements,
    ).toBe(false);

    expect(
      computeExpenseReportStepCompletion(
        report({
          lines: [{ expenseDate: new Date("2026-08-22") }],
          supportingDocuments: [{}],
        }),
      ).remboursements,
    ).toBe(true);
  });

  it("considère le bénéficiaire complet seulement avec son IBAN", () => {
    expect(
      computeExpenseReportStepCompletion(
        report({
          beneficiaryFirstname: "Camille",
          beneficiaryLastname: "Martin",
        }),
      ).beneficiaire,
    ).toBe(false);

    expect(
      computeExpenseReportStepCompletion(
        report({
          beneficiaryFirstname: "Camille",
          beneficiaryLastname: "Martin",
          beneficiaryIbanLast4: "1234",
        }),
      ).beneficiaire,
    ).toBe(true);
  });
});

describe("firstIncompleteExpenseReportStep", () => {
  it("ouvre d'abord les dépenses, puis reste sur le bénéficiaire une fois le parcours complet", () => {
    expect(
      firstIncompleteExpenseReportStep({
        remboursements: false,
        beneficiaire: false,
      }),
    ).toBe("remboursements");
    expect(
      firstIncompleteExpenseReportStep({
        remboursements: true,
        beneficiaire: false,
      }),
    ).toBe("beneficiaire");
    expect(
      firstIncompleteExpenseReportStep({
        remboursements: true,
        beneficiaire: true,
      }),
    ).toBe("beneficiaire");
  });
});
