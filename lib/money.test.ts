import { describe, it, expect } from "vitest";
import { toAmountCents, formatCents, formatCentsForPdf } from "./money";

describe("toAmountCents", () => {
  it("convertit des euros en centimes en évitant les erreurs de flottant", () => {
    expect(toAmountCents(150.5)).toBe(15050);
    expect(toAmountCents(0.1)).toBe(10);
    expect(toAmountCents(19.99)).toBe(1999);
  });
});

describe("formatCents", () => {
  it("formate des centimes en euros (fr-FR)", () => {
    expect(formatCents(15050)).toContain("150,50");
    expect(formatCents(0)).toContain("0,00");
  });
});

describe("formatCentsForPdf", () => {
  it("n'utilise que des espaces normales, pour éviter les glyphes manquants de la police PDF", () => {
    const formatted = formatCentsForPdf(197598);
    expect(formatted).toContain("1 975,98");
    expect(formatted).not.toMatch(/[  ]/);
  });
});
