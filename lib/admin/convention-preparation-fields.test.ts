import { describe, expect, it } from "vitest";
import { representativesForPrimarySection } from "./convention-preparation-fields";

describe("representativesForPrimarySection", () => {
  it("garde les deux rôles en haut après la saisie du premier caractère", () => {
    const representatives = [
      { name: "Y", role: "Président" },
      { name: "", role: "Trésorier" },
    ];

    expect(representativesForPrimarySection(representatives)).toEqual(
      representatives,
    );
  });
});
