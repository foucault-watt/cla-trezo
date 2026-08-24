import { describe, expect, it } from "vitest";
import { fixture } from "./fixture";
import { financementPdfDataSchema } from "./schema";

describe("financementPdfDataSchema", () => {
  it("accepte le cas nominal", () => {
    expect(financementPdfDataSchema.parse(fixture)).toEqual(fixture);
  });

  it("accepte un tableau de dépenses vide", () => {
    const data = { ...fixture, expenses: [] };

    expect(financementPdfDataSchema.parse(data).expenses).toHaveLength(0);
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

    expect(financementPdfDataSchema.parse(data).expenses).toHaveLength(25);
  });

  it("refuse une ligne incomplète", () => {
    expect(() =>
      financementPdfDataSchema.parse({
        ...fixture,
        expenses: [{ date: "", description: "Aprem", amount: "12,00 €" }],
      }),
    ).toThrow();
  });

  it("refuse des données invalides", () => {
    expect(() =>
      financementPdfDataSchema.parse({ ...fixture, period: "" }),
    ).toThrow();
  });
});
