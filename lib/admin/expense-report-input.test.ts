import { describe, it, expect } from "vitest";
import {
  REJECTION_REASON_MAX_LENGTH,
  parseAddReimbursementAsAdminForm,
  parseRejectExpenseReportForm,
  parseUpdateExpenseReportAsAdminForm,
  parseUpdateExpenseReportBeneficiaryAsAdminForm,
  parseUpdateReimbursementAsAdminForm,
} from "./expense-report-input";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

const reportId = "11111111-1111-1111-8111-111111111111";
const userId = "33333333-3333-3333-8333-333333333333";
const subventionId = "44444444-4444-4444-8444-444444444444";

describe("parseRejectExpenseReportForm", () => {
  it("accepte un motif et le nettoie des espaces", () => {
    const result = parseRejectExpenseReportForm(
      formData({ id: reportId, reason: "  Justificatif illisible  " }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe("Justificatif illisible");
    }
  });

  it("refuse un rejet sans motif (champ absent ou blanc)", () => {
    expect(parseRejectExpenseReportForm(formData({ id: reportId })).success).toBe(
      false,
    );
    expect(
      parseRejectExpenseReportForm(formData({ id: reportId, reason: "   " }))
        .success,
    ).toBe(false);
  });

  it("refuse un motif au-delà de la longueur maximale", () => {
    const tooLong = "a".repeat(REJECTION_REASON_MAX_LENGTH + 1);

    expect(
      parseRejectExpenseReportForm(formData({ id: reportId, reason: tooLong }))
        .success,
    ).toBe(false);
    expect(
      parseRejectExpenseReportForm(
        formData({ id: reportId, reason: tooLong.slice(1) }),
      ).success,
    ).toBe(true);
  });
});

describe("parseUpdateExpenseReportAsAdminForm", () => {
  it("transforme une description vide en null", () => {
    const result = parseUpdateExpenseReportAsAdminForm(
      formData({ id: reportId, title: "Gala", description: "" }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeNull();
    }
  });

  it("refuse un titre vide", () => {
    expect(
      parseUpdateExpenseReportAsAdminForm(formData({ id: reportId, title: "  " }))
        .success,
    ).toBe(false);
  });
});

describe("parseUpdateExpenseReportBeneficiaryAsAdminForm", () => {
  const valid = {
    id: reportId,
    beneficiaryKind: "MEMBER",
    beneficiaryUserId: userId,
    beneficiaryFirstname: "Jean",
    beneficiaryLastname: "Dupont",
    beneficiaryIban: "FR76 3000 6000 0112 3456 7890 189",
  };

  it("accepte un Membre avec son identifiant et normalise l'IBAN", () => {
    const result = parseUpdateExpenseReportBeneficiaryAsAdminForm(formData(valid));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.beneficiaryIban).toBe("FR7630006000011234567890189");
    }
  });

  it("refuse un bénéficiaire Membre sans identifiant de Membre", () => {
    expect(
      parseUpdateExpenseReportBeneficiaryAsAdminForm(
        formData({ ...valid, beneficiaryUserId: "" }),
      ).success,
    ).toBe(false);
  });

  it("accepte un bénéficiaire personnalisé sans identifiant de Membre", () => {
    const result = parseUpdateExpenseReportBeneficiaryAsAdminForm(
      formData({ ...valid, beneficiaryKind: "CUSTOM", beneficiaryUserId: "" }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.beneficiaryUserId).toBeNull();
    }
  });

  it("refuse un bénéficiaire personnalisé rattaché à un Membre", () => {
    expect(
      parseUpdateExpenseReportBeneficiaryAsAdminForm(
        formData({ ...valid, beneficiaryKind: "CUSTOM" }),
      ).success,
    ).toBe(false);
  });

  it("refuse un IBAN au format invalide", () => {
    for (const beneficiaryIban of ["FR76 3000", "FR76-3000-6000-0112-3456"]) {
      expect(
        parseUpdateExpenseReportBeneficiaryAsAdminForm(
          formData({ ...valid, beneficiaryIban }),
        ).success,
      ).toBe(false);
    }
  });
});

describe("parseAddReimbursementAsAdminForm / parseUpdateReimbursementAsAdminForm", () => {
  const line = {
    expenseDate: "2026-08-21",
    amount: "42.50",
    expenseName: "Billet de train",
    typeDepenseId: "22222222-2222-2222-8222-222222222222",
    customLabel: "",
    fundingSource: "CLUB_BALANCE",
    subventionId: "",
  };

  it("accepte une Ligne valide sans assoSlug (déduit de la Note côté Admin)", () => {
    expect(
      parseAddReimbursementAsAdminForm(
        formData({ ...line, expenseReportId: reportId }),
      ).success,
    ).toBe(true);
    expect(
      parseUpdateReimbursementAsAdminForm(formData({ ...line, id: reportId }))
        .success,
    ).toBe(true);
  });

  it("applique les mêmes règles de Ligne que côté Structure", () => {
    const add = (overrides: Record<string, string>) =>
      parseAddReimbursementAsAdminForm(
        formData({ ...line, expenseReportId: reportId, ...overrides }),
      ).success;

    // Type de dépense XOR libellé personnalisé
    expect(add({ customLabel: "Divers" })).toBe(false);
    expect(add({ typeDepenseId: "" })).toBe(false);
    // Subvention obligatoire si et seulement si la source est une Subvention
    expect(add({ fundingSource: "SUBVENTION" })).toBe(false);
    expect(add({ subventionId })).toBe(false);
    expect(add({ fundingSource: "SUBVENTION", subventionId })).toBe(true);
    // Montant strictement positif, date obligatoire
    expect(add({ amount: "0" })).toBe(false);
    expect(add({ expenseDate: "" })).toBe(false);
  });
});
