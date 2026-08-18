import { describe, expect, it } from "vitest";
import { getPdfTemplate, listPdfTemplates } from "./registry";

describe("PDF template registry", () => {
  it("expose les templates dans un ordre stable", () => {
    expect(listPdfTemplates().map((template) => template.slug)).toEqual([
      "convention",
      "ndf-fn-sb",
    ]);
  });

  it("retourne une erreur explicite pour un slug inconnu", () => {
    expect(() => getPdfTemplate("inconnu")).toThrow(
      "Templates disponibles : convention, ndf-fn-sb",
    );
  });
});
