import { describe, it, expect } from "vitest";
import {
  parseCreateExpenseReportForm,
  parseUpdateExpenseReportForm,
  parseAddExpenseReportLineForm,
  parseUpdateExpenseReportLineForm,
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

const validLine = {
  expenseReportId: "11111111-1111-1111-8111-111111111111",
  assoSlug: "club-info",
  beneficiaryFirstname: "Jean",
  beneficiaryLastname: "Dupont",
  iban: "FR7630006000011234567890189",
  amount: "42.50",
  expenseName: "Courses pour le pot d'intégration",
  typeDepenseId: "22222222-2222-2222-8222-222222222222",
  customLabel: "",
  fundingSource: "CLUB_BALANCE",
  subventionId: "",
};

describe("parseAddExpenseReportLineForm", () => {
  it("accepte une Ligne financée par le Solde avec un Type de dépense existant", () => {
    const result = parseAddExpenseReportLineForm(formData(validLine));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.iban).toBe("FR7630006000011234567890189");
      expect(result.data.customLabel).toBeNull();
      expect(result.data.subventionId).toBeNull();
    }
  });

  it("accepte une Ligne financée par une Subvention avec un libellé personnalisé", () => {
    const result = parseAddExpenseReportLineForm(
      formData({
        ...validLine,
        typeDepenseId: "",
        customLabel: "Location de matériel",
        fundingSource: "SUBVENTION",
        subventionId: "33333333-3333-3333-8333-333333333333",
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.typeDepenseId).toBeNull();
      expect(result.data.customLabel).toBe("Location de matériel");
      expect(result.data.subventionId).toBe(
        "33333333-3333-3333-8333-333333333333",
      );
    }
  });

  it("ignore les espaces dans l'IBAN et le met en majuscules", () => {
    const result = parseAddExpenseReportLineForm(
      formData({
        ...validLine,
        iban: "fr76 3000 6000 0112 3456 7890 189",
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.iban).toBe("FR7630006000011234567890189");
    }
  });

  it("refuse un IBAN trop court même une fois les espaces retirés", () => {
    const result = parseAddExpenseReportLineForm(
      formData({ ...validLine, iban: "FR76 30" }),
    );

    expect(result.success).toBe(false);
  });

  it("refuse un Type de dépense ET un libellé personnalisé en même temps", () => {
    const result = parseAddExpenseReportLineForm(
      formData({ ...validLine, customLabel: "Autre chose" }),
    );

    expect(result.success).toBe(false);
  });

  it("refuse l'absence de Type de dépense ET de libellé personnalisé", () => {
    const result = parseAddExpenseReportLineForm(
      formData({ ...validLine, typeDepenseId: "" }),
    );

    expect(result.success).toBe(false);
  });

  it("refuse une source Subvention sans subventionId", () => {
    const result = parseAddExpenseReportLineForm(
      formData({ ...validLine, fundingSource: "SUBVENTION" }),
    );

    expect(result.success).toBe(false);
  });

  it("refuse une source Solde avec un subventionId fourni", () => {
    const result = parseAddExpenseReportLineForm(
      formData({
        ...validLine,
        subventionId: "33333333-3333-3333-8333-333333333333",
      }),
    );

    expect(result.success).toBe(false);
  });

  it("refuse un montant négatif ou nul", () => {
    expect(
      parseAddExpenseReportLineForm(formData({ ...validLine, amount: "0" }))
        .success,
    ).toBe(false);
    expect(
      parseAddExpenseReportLineForm(formData({ ...validLine, amount: "-5" }))
        .success,
    ).toBe(false);
  });
});

describe("parseUpdateExpenseReportLineForm", () => {
  const validUpdate = {
    ...validLine,
    id: "44444444-4444-4444-8444-444444444444",
  };

  it("accepte une saisie valide", () => {
    const result = parseUpdateExpenseReportLineForm(formData(validUpdate));

    expect(result.success).toBe(true);
  });

  it("applique la même règle d'exclusivité Type de dépense / libellé personnalisé", () => {
    const result = parseUpdateExpenseReportLineForm(
      formData({ ...validUpdate, customLabel: "Autre chose" }),
    );

    expect(result.success).toBe(false);
  });
});
