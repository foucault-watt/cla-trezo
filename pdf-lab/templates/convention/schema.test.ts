import { describe, expect, it } from "vitest";
import { fixture } from "./fixture";
import { subsidyConventionPdfDataSchema } from "./schema";

describe("subsidyConventionPdfDataSchema", () => {
  it("accepte la fixture et des tableaux de longueur variable", () => {
    for (const length of [0, 1, 30]) {
      const expenses = Array.from({ length }, (_, index) => ({
        grantedOn: `Date ${index + 1}`,
        description: `Dépense ${index + 1}`,
        amount: `${index + 1},00 €`,
      }));

      expect(
        subsidyConventionPdfDataSchema.parse({ ...fixture, expenses }).expenses,
      ).toHaveLength(length);
    }
  });

  it("refuse une partie ou une dépense incomplète", () => {
    expect(() =>
      subsidyConventionPdfDataSchema.parse({
        ...fixture,
        firstParty: { ...fixture.firstParty, associationName: "" },
      }),
    ).toThrow();
    expect(() =>
      subsidyConventionPdfDataSchema.parse({
        ...fixture,
        expenses: [{ grantedOn: "", description: "WEAC", amount: "1 €" }],
      }),
    ).toThrow();
  });

  it("autorise une zone de signature bénéficiaire vide uniquement", () => {
    expect(() =>
      subsidyConventionPdfDataSchema.parse({
        ...fixture,
        secondPartySignature: {
          ...fixture.secondPartySignature,
          signatoryName: "",
          signatoryRole: "",
          city: "",
        },
      }),
    ).not.toThrow();
    expect(() =>
      subsidyConventionPdfDataSchema.parse({
        ...fixture,
        firstPartySignature: {
          ...fixture.firstPartySignature,
          signatoryName: "",
        },
      }),
    ).toThrow();
  });
});
