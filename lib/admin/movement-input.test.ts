import { describe, it, expect } from "vitest";
import { parseManualMovementForm, toAmountCents } from "./movement-input";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

describe("parseManualMovementForm", () => {
  const valid = {
    assoId: "11111111-1111-1111-8111-111111111111",
    assoSlug: "club-info",
    movementType: "CREDIT",
    amount: "150.50",
    description: "Solde initial de l'année",
    date: "2026-01-15",
  };

  it("accepte une saisie valide", () => {
    const result = parseManualMovementForm(formData(valid));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        ...valid,
        amount: 150.5,
        date: new Date("2026-01-15"),
      });
    }
  });

  it("accepte une date passée, choisie librement par l'admin", () => {
    const result = parseManualMovementForm(
      formData({ ...valid, date: "2020-09-01" }),
    );

    expect(result.success).toBe(true);
  });

  it("refuse une date invalide", () => {
    expect(
      parseManualMovementForm(formData({ ...valid, date: "pas-une-date" }))
        .success,
    ).toBe(false);
  });

  it("refuse un montant négatif ou nul", () => {
    expect(
      parseManualMovementForm(formData({ ...valid, amount: "0" })).success,
    ).toBe(false);
    expect(
      parseManualMovementForm(formData({ ...valid, amount: "-10" })).success,
    ).toBe(false);
  });

  it("refuse une description vide", () => {
    expect(
      parseManualMovementForm(formData({ ...valid, description: "   " }))
        .success,
    ).toBe(false);
  });

  it("refuse un movementType hors CREDIT/DEBIT", () => {
    expect(
      parseManualMovementForm(formData({ ...valid, movementType: "AUTRE" }))
        .success,
    ).toBe(false);
  });

  it("refuse un assoId qui n'est pas un uuid", () => {
    expect(
      parseManualMovementForm(formData({ ...valid, assoId: "pas-un-uuid" }))
        .success,
    ).toBe(false);
  });
});

describe("toAmountCents", () => {
  it("convertit des euros en centimes en évitant les erreurs de flottant", () => {
    expect(toAmountCents(150.5)).toBe(15050);
    expect(toAmountCents(0.1)).toBe(10);
    expect(toAmountCents(19.99)).toBe(1999);
  });
});
