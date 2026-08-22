import { describe, it, expect } from "vitest";
import {
  parseCreateExpenseReportForm,
  parseUpdateExpenseReportForm,
  parseAddReimbursementForm,
  parseUpdateExpenseReportBeneficiaryForm,
} from "./expense-report-input";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

describe("parseCreateExpenseReportForm", () => {
  const valid = {
    assoSlug: "club-info",
    title: "Déplacement gala 2026",
    description: "Remboursement des billets de train",
  };

  it("accepte une saisie valide", () => {
    const result = parseCreateExpenseReportForm(formData(valid));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe(valid.title);
      expect(result.data.description).toBe(valid.description);
    }
  });

  it("transforme une description vide en null", () => {
    const result = parseCreateExpenseReportForm(
      formData({ ...valid, description: "" }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
    }
  });

  it("refuse un titre vide", () => {
    expect(
      parseCreateExpenseReportForm(formData({ ...valid, title: "   " }))
        .success,
    ).toBe(false);
  });
});

describe("parseAddReimbursementForm", () => {
  const valid = {
    expenseReportId: "11111111-1111-1111-8111-111111111111",
    assoSlug: "club-info",
    expenseDate: "2026-08-21",
    amount: "42.50",
    expenseName: "Billet de train",
    typeDepenseId: "22222222-2222-2222-8222-222222222222",
    customLabel: "",
    fundingSource: "CLUB_BALANCE",
    subventionId: "",
  };

  it("accepte un Remboursement daté sans identité de bénéficiaire", () => {
    const result = parseAddReimbursementForm(formData(valid));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expenseDate).toEqual(
        new Date("2026-08-21T00:00:00.000Z"),
      );
    }
  });

  it("refuse un Remboursement sans date", () => {
    expect(
      parseAddReimbursementForm(formData({ ...valid, expenseDate: "" }))
        .success,
    ).toBe(false);
  });
});

describe("parseUpdateExpenseReportBeneficiaryForm", () => {
  const common = {
    id: "11111111-1111-1111-8111-111111111111",
    assoSlug: "club-info",
    beneficiaryFirstname: "Jean",
    beneficiaryLastname: "Dupont",
    beneficiaryIban: "fr76 3000 6000 0112 3456 7890 189",
  };

  it("accepte un membre avec son identifiant", () => {
    const result = parseUpdateExpenseReportBeneficiaryForm(
      formData({
        ...common,
        beneficiaryKind: "MEMBER",
        beneficiaryUserId: "22222222-2222-2222-8222-222222222222",
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.beneficiaryIban).toBe("FR7630006000011234567890189");
    }
  });

  it("accepte un bénéficiaire personnalisé sans userId", () => {
    expect(
      parseUpdateExpenseReportBeneficiaryForm(
        formData({
          ...common,
          beneficiaryKind: "CUSTOM",
          beneficiaryUserId: "",
        }),
      ).success,
    ).toBe(true);
  });

  it("refuse un membre sans userId", () => {
    expect(
      parseUpdateExpenseReportBeneficiaryForm(
        formData({
          ...common,
          beneficiaryKind: "MEMBER",
          beneficiaryUserId: "",
        }),
      ).success,
    ).toBe(false);
  });
});

describe("parseUpdateExpenseReportForm", () => {
  const valid = {
    id: "11111111-1111-1111-8111-111111111111",
    assoSlug: "club-info",
    title: "Déplacement gala 2026",
    description: "",
  };

  it("accepte une saisie valide", () => {
    expect(parseUpdateExpenseReportForm(formData(valid)).success).toBe(true);
  });

  it("refuse un id qui n'est pas un uuid", () => {
    expect(
      parseUpdateExpenseReportForm(formData({ ...valid, id: "pas-un-uuid" }))
        .success,
    ).toBe(false);
  });
});
