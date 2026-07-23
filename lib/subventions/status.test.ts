import { describe, it, expect } from "vitest";
import { getCampaignStatus } from "./status";

describe("getCampaignStatus", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("renvoie PROGRAMMEE si la date de publication est nulle", () => {
    expect(getCampaignStatus(null, now)).toBe("PROGRAMMEE");
  });

  it("renvoie PROGRAMMEE si la date de publication est future", () => {
    expect(getCampaignStatus(new Date("2026-07-01T00:00:00Z"), now)).toBe(
      "PROGRAMMEE",
    );
  });

  it("renvoie PUBLIEE si la date de publication est passée", () => {
    expect(getCampaignStatus(new Date("2026-01-01T00:00:00Z"), now)).toBe(
      "PUBLIEE",
    );
  });

  it("renvoie PUBLIEE si la date de publication est atteinte exactement", () => {
    expect(getCampaignStatus(now, now)).toBe("PUBLIEE");
  });
});
