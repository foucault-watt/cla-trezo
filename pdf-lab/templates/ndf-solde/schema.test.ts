import { describe, expect, it } from "vitest";
import { fixture } from "./fixture";
import { expenseBalancePdfDataSchema } from "./schema";

describe("expenseBalancePdfDataSchema", () => {
  it("accepte le cas nominal", () => {
    expect(expenseBalancePdfDataSchema.parse(fixture)).toEqual(fixture);
  });

  it("accepte un tableau de dépenses vide", () => {
    const data = { ...fixture, expenses: [] };

    expect(expenseBalancePdfDataSchema.parse(data).expenses).toHaveLength(0);
  });

  it("accepte un tableau de dépenses de longueur variable", () => {
    const data = {
      ...fixture,
      expenses: Array.from({ length: 25 }, (_, index) => ({
        date: `Ligne ${index + 1}`,
        description: `Dépense ${index + 1}`,
        amount: `${index + 1},00 €`,
      })),
    };

    expect(expenseBalancePdfDataSchema.parse(data).expenses).toHaveLength(25);
  });

  it("refuse une ligne incomplète", () => {
    expect(() =>
      expenseBalancePdfDataSchema.parse({
        ...fixture,
        expenses: [{ date: "", description: "Taxi", amount: "12,00 €" }],
      }),
    ).toThrow();
  });

  it("refuse des données invalides", () => {
    expect(() =>
      expenseBalancePdfDataSchema.parse({ ...fixture, reportDate: "" }),
    ).toThrow();
  });

  it("accepte reconstitutionNote, optionnel", () => {
    const data = {
      ...fixture,
      reconstitutionNote: "Document reconstitué le 20/03/2026.",
    };

    expect(expenseBalancePdfDataSchema.parse(data).reconstitutionNote).toBe(
      "Document reconstitué le 20/03/2026.",
    );
  });
});
