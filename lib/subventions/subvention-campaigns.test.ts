import { describe, expect, it } from "vitest";
import {
  getSubventionCampaignAgeBand,
  groupSubventionsByCampaign,
  splitSubventionCampaignsByAge,
  SUBVENTION_OLD_DAYS,
  SUBVENTION_RECENT_DAYS,
} from "./subvention-campaigns";
import type { VisibleSubvention } from "./visible-subventions";

const NOW = new Date("2026-09-12T00:00:00Z");

function subvention(
  overrides: Partial<VisibleSubvention> & Pick<VisibleSubvention, "id" | "campaignId">,
): VisibleSubvention {
  return {
    campaignName: "Campagne",
    type: "CA_BUDGET",
    reason: "Motif",
    totalAmountCents: 1000,
    usedAmountCents: 0,
    remainingAmountCents: 1000,
    commentary: null,
    publicationDate: NOW,
    campaignDate: NOW,
    stale: false,
    ...overrides,
  };
}

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

describe("getSubventionCampaignAgeBand", () => {
  it("est 'recent' jusqu'au seuil inclus", () => {
    expect(
      getSubventionCampaignAgeBand(daysAgo(SUBVENTION_RECENT_DAYS), NOW),
    ).toBe("recent");
  });

  it("devient 'old' juste après le seuil récent", () => {
    expect(
      getSubventionCampaignAgeBand(daysAgo(SUBVENTION_RECENT_DAYS + 1), NOW),
    ).toBe("old");
  });

  it("est 'old' jusqu'au seuil ancien inclus", () => {
    expect(
      getSubventionCampaignAgeBand(daysAgo(SUBVENTION_OLD_DAYS), NOW),
    ).toBe("old");
  });

  it("devient 'history' juste après le seuil ancien", () => {
    expect(
      getSubventionCampaignAgeBand(daysAgo(SUBVENTION_OLD_DAYS + 1), NOW),
    ).toBe("history");
  });
});

describe("groupSubventionsByCampaign", () => {
  it("regroupe les Subventions d'une même Campagne et cumule les montants", () => {
    const groups = groupSubventionsByCampaign([
      subvention({
        id: "s1",
        campaignId: "c1",
        totalAmountCents: 1000,
        usedAmountCents: 200,
        remainingAmountCents: 800,
      }),
      subvention({
        id: "s2",
        campaignId: "c1",
        totalAmountCents: 500,
        usedAmountCents: 500,
        remainingAmountCents: 0,
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].subventions).toHaveLength(2);
    expect(groups[0].totalAmountCents).toBe(1500);
    expect(groups[0].usedAmountCents).toBe(700);
    expect(groups[0].remainingAmountCents).toBe(800);
  });

  it("trie les Campagnes de la plus récente à la plus ancienne", () => {
    const groups = groupSubventionsByCampaign([
      subvention({ id: "s1", campaignId: "old", publicationDate: daysAgo(400) }),
      subvention({ id: "s2", campaignId: "new", publicationDate: daysAgo(10) }),
    ]);

    expect(groups.map((g) => g.id)).toEqual(["new", "old"]);
  });
});

describe("splitSubventionCampaignsByAge", () => {
  it("répartit chaque Campagne dans sa bande d'âge", () => {
    const bands = splitSubventionCampaignsByAge(
      [
        subvention({ id: "s1", campaignId: "recent", publicationDate: daysAgo(10) }),
        subvention({ id: "s2", campaignId: "old", publicationDate: daysAgo(400) }),
        subvention({ id: "s3", campaignId: "history", publicationDate: daysAgo(800) }),
      ],
      NOW,
    );

    expect(bands.recent.map((g) => g.id)).toEqual(["recent"]);
    expect(bands.old.map((g) => g.id)).toEqual(["old"]);
    expect(bands.history.map((g) => g.id)).toEqual(["history"]);
  });
});
