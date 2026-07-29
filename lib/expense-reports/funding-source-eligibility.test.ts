import { describe, expect, it } from "vitest";
import { checkFundingSourceEligibility } from "./funding-source-eligibility";

const ASSO_ID = "11111111-1111-1111-8111-111111111111";
const OTHER_ASSO_ID = "22222222-2222-2222-8222-222222222222";
const NOW = new Date("2026-07-29T00:00:00Z");

describe("checkFundingSourceEligibility", () => {
  it("refuse le Solde pour une Structure qui n'est pas un Club", () => {
    const result = checkFundingSourceEligibility({
      fundingSource: "CLUB_BALANCE",
      assoType: "ASSOCIATION_1901",
    });

    expect(result).toEqual({
      ok: false,
      error: "Seuls les Clubs peuvent utiliser le Solde.",
    });
  });

  it("refuse une Subvention appartenant à une autre Structure", () => {
    const result = checkFundingSourceEligibility({
      assoId: ASSO_ID,
      fundingSource: "SUBVENTION",
      subvention: {
        assoId: OTHER_ASSO_ID,
        campaignPublicationDate: new Date("2026-01-01T00:00:00Z"),
      },
      now: NOW,
    });

    expect(result).toEqual({
      ok: false,
      error: "Subvention introuvable ou non publiée.",
    });
  });

  it("refuse une Subvention dont la Campagne n'est pas Publiée", () => {
    const result = checkFundingSourceEligibility({
      assoId: ASSO_ID,
      fundingSource: "SUBVENTION",
      subvention: {
        assoId: ASSO_ID,
        campaignPublicationDate: null,
      },
      now: NOW,
    });

    expect(result).toEqual({
      ok: false,
      error: "Subvention introuvable ou non publiée.",
    });
  });

  it("accepte le Solde pour un Club", () => {
    const result = checkFundingSourceEligibility({
      fundingSource: "CLUB_BALANCE",
      assoType: "CLUB",
    });

    expect(result).toEqual({ ok: true });
  });

  it("accepte une Subvention de la même Structure dont la Campagne est Publiée", () => {
    const result = checkFundingSourceEligibility({
      assoId: ASSO_ID,
      fundingSource: "SUBVENTION",
      subvention: {
        assoId: ASSO_ID,
        campaignPublicationDate: new Date("2026-01-01T00:00:00Z"),
      },
      now: NOW,
    });

    expect(result).toEqual({ ok: true });
  });
});
