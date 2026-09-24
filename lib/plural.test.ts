import { describe, it, expect } from "vitest";
import { agree, pluralize } from "./plural";

describe("agree", () => {
  it("garde le singulier pour 0 et 1, à la française", () => {
    expect(agree(0, "note")).toBe("note");
    expect(agree(1, "note")).toBe("note");
    expect(agree(2, "note")).toBe("notes");
  });

  it("utilise le pluriel fourni pour les groupes de mots", () => {
    expect(agree(3, "fichier prêt", "fichiers prêts")).toBe("fichiers prêts");
  });
});

describe("pluralize", () => {
  it("préfixe le mot accordé par le nombre", () => {
    expect(pluralize(1, "dépense")).toBe("1 dépense");
    expect(pluralize(4, "dépense")).toBe("4 dépenses");
  });
});
