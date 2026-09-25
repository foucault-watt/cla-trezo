import { describe, expect, it } from "vitest";
import {
  getSubventionAgeBand,
  isSubventionStale,
  isSubventionWithinFundingWindow,
} from "./subvention-age";

const NOW = new Date("2026-09-12T12:00:00Z");

describe("getSubventionAgeBand", () => {
  it("est 'recent' jusqu'à un an jour pour jour", () => {
    expect(getSubventionAgeBand(new Date("2025-09-12T12:00:00Z"), NOW)).toBe(
      "recent",
    );
  });

  it("devient 'old' au-delà d'un an", () => {
    expect(getSubventionAgeBand(new Date("2025-09-11T12:00:00Z"), NOW)).toBe(
      "old",
    );
  });

  it("est 'old' jusqu'à deux ans jour pour jour", () => {
    expect(getSubventionAgeBand(new Date("2024-09-12T12:00:00Z"), NOW)).toBe(
      "old",
    );
  });

  it("devient 'history' au-delà de deux ans", () => {
    expect(getSubventionAgeBand(new Date("2024-09-11T12:00:00Z"), NOW)).toBe(
      "history",
    );
  });
});

describe("isSubventionStale", () => {
  it("ne déclenche pas pour une Campagne publiée il y a moins d'un an", () => {
    expect(isSubventionStale(new Date("2025-10-01T00:00:00Z"), NOW)).toBe(
      false,
    );
  });

  it("déclenche pour une Campagne publiée il y a plus d'un an", () => {
    expect(isSubventionStale(new Date("2025-08-01T00:00:00Z"), NOW)).toBe(true);
  });

  it("ne déclenche jamais pour une Campagne sans date de publication", () => {
    expect(isSubventionStale(null, NOW)).toBe(false);
  });
});

describe("isSubventionWithinFundingWindow", () => {
  it("accepte une Campagne publiée il y a moins de deux ans", () => {
    expect(
      isSubventionWithinFundingWindow(new Date("2025-08-01T00:00:00Z"), NOW),
    ).toBe(true);
  });

  it("refuse une Campagne publiée il y a plus de deux ans", () => {
    expect(
      isSubventionWithinFundingWindow(new Date("2024-08-01T00:00:00Z"), NOW),
    ).toBe(false);
  });
});
