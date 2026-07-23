import { describe, it, expect } from "vitest";
import { parseSetAssoTypeForm } from "./asso-type-input";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

const valid = {
  assoId: "11111111-1111-1111-8111-111111111111",
  assoSlug: "club-info",
  type: "CLUB",
};

describe("parseSetAssoTypeForm", () => {
  it("accepte CLUB, COMMISSION et ASSOCIATION_1901", () => {
    for (const type of ["CLUB", "COMMISSION", "ASSOCIATION_1901"]) {
      expect(parseSetAssoTypeForm(formData({ ...valid, type })).success).toBe(
        true,
      );
    }
  });

  it("refuse un type hors de l'enum", () => {
    expect(
      parseSetAssoTypeForm(formData({ ...valid, type: "AUTRE" })).success,
    ).toBe(false);
  });

  it("refuse un assoId qui n'est pas un uuid", () => {
    expect(
      parseSetAssoTypeForm(formData({ ...valid, assoId: "pas-un-uuid" }))
        .success,
    ).toBe(false);
  });
});
