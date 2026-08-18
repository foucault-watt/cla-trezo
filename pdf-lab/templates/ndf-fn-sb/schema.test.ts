import { describe, expect, it } from "vitest";
import { fixture } from "./fixture";
import { expenseReportPdfDataSchema } from "./schema";

describe("expenseReportPdfDataSchema", () => {
  it("accepte des tableaux de longueur variable", () => {
    const data = {
      ...fixture,
      grantedExpenses: Array.from({ length: 25 }, (_, index) => ({
        date: `Ligne ${index + 1}`,
        description: `Dépense ${index + 1}`,
        amount: `${index + 1},00 €`,
      })),
    };

    expect(expenseReportPdfDataSchema.parse(data).grantedExpenses).toHaveLength(
      25,
    );
  });

  it("refuse une ligne incomplète", () => {
    expect(() =>
      expenseReportPdfDataSchema.parse({
        ...fixture,
        expensesToReimburse: [
          { date: "", description: "Taxi", amount: "12,00 €" },
        ],
      }),
    ).toThrow();
  });
});
