import { describe, expect, it } from "vitest";
import {
  checkNegativeBalanceWarning,
  checkSubventionOverageWarning,
  computeLineWarnings,
  isSubventionStale,
  isSubventionWithinFundingWindow,
  LINE_WARNING_MESSAGES,
} from "./line-warnings";

const NOW = new Date("2026-08-18T00:00:00Z");

describe("checkNegativeBalanceWarning", () => {
  it("ne déclenche pas quand le solde projeté reste positif ou nul", () => {
    expect(
      checkNegativeBalanceWarning({
        confirmedBalanceCents: 10000,
        pendingOtherLinesCents: 3000,
        lineAmountCents: 7000,
      }),
    ).toBe(false);
  });

  it("déclenche quand cette Ligne crée un solde négatif", () => {
    expect(
      checkNegativeBalanceWarning({
        confirmedBalanceCents: 5000,
        pendingOtherLinesCents: 0,
        lineAmountCents: 5001,
      }),
    ).toBe(true);
  });

  it("déclenche quand le solde était déjà négatif et que cette Ligne l'aggrave", () => {
    expect(
      checkNegativeBalanceWarning({
        confirmedBalanceCents: -2000,
        pendingOtherLinesCents: 0,
        lineAmountCents: 100,
      }),
    ).toBe(true);
  });

  it("cumule les autres Lignes en attente sur le même Solde", () => {
    expect(
      checkNegativeBalanceWarning({
        confirmedBalanceCents: 10000,
        pendingOtherLinesCents: 9500,
        lineAmountCents: 600,
      }),
    ).toBe(true);
  });
});

describe("checkSubventionOverageWarning", () => {
  it("ne déclenche pas quand la Ligne tient dans le montant restant", () => {
    expect(
      checkSubventionOverageWarning({
        subventionTotalCents: 10000,
        confirmedUsedCents: 2000,
        pendingOtherLinesCents: 1000,
        lineAmountCents: 7000,
      }),
    ).toBe(false);
  });

  it("déclenche quand la Ligne dépasse le montant restant", () => {
    expect(
      checkSubventionOverageWarning({
        subventionTotalCents: 10000,
        confirmedUsedCents: 2000,
        pendingOtherLinesCents: 1000,
        lineAmountCents: 7001,
      }),
    ).toBe(true);
  });

  it("ne cumule que les Lignes en attente de la même Subvention (déjà scopé par l'appelant)", () => {
    expect(
      checkSubventionOverageWarning({
        subventionTotalCents: 5000,
        confirmedUsedCents: 0,
        pendingOtherLinesCents: 0,
        lineAmountCents: 5000,
      }),
    ).toBe(false);
  });
});

describe("isSubventionStale", () => {
  it("ne déclenche pas pour une Campagne datée de moins d'un an", () => {
    expect(isSubventionStale(new Date("2025-09-01T00:00:00Z"), NOW)).toBe(
      false,
    );
  });

  it("déclenche pour une Campagne datée de plus d'un an", () => {
    expect(isSubventionStale(new Date("2025-08-01T00:00:00Z"), NOW)).toBe(
      true,
    );
  });
});

describe("isSubventionWithinFundingWindow", () => {
  it("accepte une Campagne datée de moins de deux ans", () => {
    expect(
      isSubventionWithinFundingWindow(new Date("2025-08-01T00:00:00Z"), NOW),
    ).toBe(true);
  });

  it("refuse une Campagne datée de plus de deux ans", () => {
    expect(
      isSubventionWithinFundingWindow(new Date("2024-08-01T00:00:00Z"), NOW),
    ).toBe(false);
  });
});

describe("computeLineWarnings", () => {
  it("ne bloque jamais : renvoie une liste de messages, jamais une erreur", () => {
    const warnings = computeLineWarnings({
      fundingSource: "CLUB_BALANCE",
      confirmedBalanceCents: -1000,
      pendingOtherLinesCents: 0,
      lineAmountCents: 500,
    });
    expect(Array.isArray(warnings)).toBe(true);
    expect(warnings).toEqual([LINE_WARNING_MESSAGES.NEGATIVE_BALANCE]);
  });

  it("renvoie un tableau vide pour le Solde quand tout va bien", () => {
    expect(
      computeLineWarnings({
        fundingSource: "CLUB_BALANCE",
        confirmedBalanceCents: 1000,
        pendingOtherLinesCents: 0,
        lineAmountCents: 500,
      }),
    ).toEqual([]);
  });

  it("cumule dépassement ET ancienneté pour une Subvention", () => {
    const warnings = computeLineWarnings({
      fundingSource: "SUBVENTION",
      subventionTotalCents: 1000,
      confirmedUsedCents: 0,
      pendingOtherLinesCents: 0,
      lineAmountCents: 2000,
      campaignDate: new Date("2025-01-01T00:00:00Z"),
      now: NOW,
    });
    expect(warnings).toEqual([
      LINE_WARNING_MESSAGES.SUBVENTION_OVERAGE,
      LINE_WARNING_MESSAGES.STALE_SUBVENTION,
    ]);
  });

  it("renvoie un tableau vide pour une Subvention récente et non dépassée", () => {
    expect(
      computeLineWarnings({
        fundingSource: "SUBVENTION",
        subventionTotalCents: 1000,
        confirmedUsedCents: 0,
        pendingOtherLinesCents: 0,
        lineAmountCents: 500,
        campaignDate: NOW,
        now: NOW,
      }),
    ).toEqual([]);
  });
});
