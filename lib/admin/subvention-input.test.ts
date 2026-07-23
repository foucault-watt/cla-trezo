import { describe, it, expect } from "vitest";
import { parseSubventionForm } from "./subvention-input";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

const valid = {
  campaignId: "11111111-1111-1111-8111-111111111111",
  assoId: "22222222-2222-2222-8222-222222222222",
  reason: "Achat de matériel sportif",
  amount: "350.50",
  commentary: "Sur présentation de facture",
};

describe("parseSubventionForm", () => {
  it("accepte une saisie valide", () => {
    const result = parseSubventionForm(formData(valid));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        ...valid,
        amount: 350.5,
      });
    }
  });

  it("accepte une saisie sans commentaire", () => {
    const fd = formData(valid);
    fd.delete("commentary");

    const result = parseSubventionForm(fd);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.commentary).toBeNull();
    }
  });

  it("refuse un montant négatif ou nul", () => {
    expect(
      parseSubventionForm(formData({ ...valid, amount: "0" })).success,
    ).toBe(false);
    expect(
      parseSubventionForm(formData({ ...valid, amount: "-10" })).success,
    ).toBe(false);
  });

  it("refuse une raison vide", () => {
    expect(
      parseSubventionForm(formData({ ...valid, reason: "   " })).success,
    ).toBe(false);
  });

  it("refuse un campaignId ou un assoId qui ne sont pas des uuid", () => {
    expect(
      parseSubventionForm(formData({ ...valid, campaignId: "pas-un-uuid" }))
        .success,
    ).toBe(false);
    expect(
      parseSubventionForm(formData({ ...valid, assoId: "pas-un-uuid" }))
        .success,
    ).toBe(false);
  });
});
