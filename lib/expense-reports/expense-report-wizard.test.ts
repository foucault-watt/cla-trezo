import { describe, expect, it } from "vitest";
import { firstIncompleteExpenseReportStep } from "./expense-report-steps";
import {
  computeExpenseReportStepCompletion,
  isEditableInStructureSpace,
} from "./expense-report-wizard";

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

describe("isEditableInStructureSpace", () => {
  it("ouvre le Brouillon et la Note Soumise à un membre de la Structure", () => {
    expect(isEditableInStructureSpace({ status: "DRAFT", assoId: "asso-1", readOnlyAsAdmin: false })).toBe(true);
    expect(isEditableInStructureSpace({ status: "SUBMITTED", assoId: "asso-1", readOnlyAsAdmin: false })).toBe(true);
  });

  it("ferme la Note dès sa Prise en charge (ADR-0001)", () => {
    expect(isEditableInStructureSpace({ status: "TAKEN_OVER", assoId: "asso-1", readOnlyAsAdmin: false })).toBe(false);
  });

  it("laisse un Admin non membre en lecture seule, même sur une Note Soumise", () => {
    expect(isEditableInStructureSpace({ status: "DRAFT", assoId: "asso-1", readOnlyAsAdmin: true })).toBe(false);
    expect(isEditableInStructureSpace({ status: "SUBMITTED", assoId: "asso-1", readOnlyAsAdmin: true })).toBe(false);
  });
});
