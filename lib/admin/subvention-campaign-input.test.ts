import { describe, it, expect } from "vitest";
import {
  parseSubventionCampaignForm,
  parseSubventionCampaignUpdateForm,
} from "./subvention-campaign-input";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

const valid = {
  type: "CA_BUDGET",
  name: "Campagne CA Budget 2026",
  date: "2026-09-01",
  publicationDate: "2026-09-15",
};

describe("parseSubventionCampaignForm", () => {
  it("accepte une saisie valide", () => {
    const result = parseSubventionCampaignForm(formData(valid));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        type: "CA_BUDGET",
        name: valid.name,
        date: new Date(valid.date),
        publicationDate: new Date(valid.publicationDate),
      });
    }
  });

  it("accepte une date de publication vide : la campagne reste Programmée", () => {
    const result = parseSubventionCampaignForm(
      formData({ ...valid, publicationDate: "" }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.publicationDate).toBeNull();
    }
  });

  it("refuse un type hors enum", () => {
    expect(
      parseSubventionCampaignForm(formData({ ...valid, type: "AUTRE" }))
        .success,
    ).toBe(false);
  });

  it("refuse un nom vide", () => {
    expect(
      parseSubventionCampaignForm(formData({ ...valid, name: "   " }))
        .success,
    ).toBe(false);
  });

  it("refuse une date invalide", () => {
    expect(
      parseSubventionCampaignForm(formData({ ...valid, date: "pas-une-date" }))
        .success,
    ).toBe(false);
  });

  it("refuse une date de publication invalide", () => {
    expect(
      parseSubventionCampaignForm(
        formData({ ...valid, publicationDate: "pas-une-date" }),
      ).success,
    ).toBe(false);
  });
});

describe("parseSubventionCampaignUpdateForm", () => {
  const validUpdate = { ...valid, campaignId: "11111111-1111-1111-8111-111111111111" };

  it("accepte une saisie valide, campaignId compris", () => {
    const result = parseSubventionCampaignUpdateForm(formData(validUpdate));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.campaignId).toBe("11111111-1111-1111-8111-111111111111");
    }
  });

  it("refuse un campaignId manquant", () => {
    const fd = formData(valid);

    expect(parseSubventionCampaignUpdateForm(fd).success).toBe(false);
  });
});
