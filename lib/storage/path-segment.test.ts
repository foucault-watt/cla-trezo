import { describe, it, expect } from "vitest";
import { assertSafePathSegment, isSafePathSegment } from "./path-segment";

describe("isSafePathSegment", () => {
  it("accepte un slug alphanumérique avec tirets", () => {
    expect(isSafePathSegment("club-info")).toBe(true);
  });

  it("accepte un uuid", () => {
    expect(isSafePathSegment("11111111-1111-1111-8111-111111111111")).toBe(
      true,
    );
  });

  it("refuse une tentative de traversée de répertoire", () => {
    expect(isSafePathSegment("../../etc")).toBe(false);
  });

  it("refuse un séparateur de chemin", () => {
    expect(isSafePathSegment("foo/bar")).toBe(false);
    expect(isSafePathSegment("foo\\bar")).toBe(false);
  });

  it("refuse une chaîne vide", () => {
    expect(isSafePathSegment("")).toBe(false);
  });
});

describe("assertSafePathSegment", () => {
  it("ne lève pas pour un segment valide", () => {
    expect(() => assertSafePathSegment("report-1", "reportId")).not.toThrow();
  });

  it("lève pour un segment invalide", () => {
    expect(() => assertSafePathSegment("..", "reportId")).toThrow(
      /Segment de chemin invalide/,
    );
  });
});
