import { describe, expect, it } from "vitest";
import { summarizeVisits } from "./visits";

const at = (iso: string) => new Date(iso);

describe("summarizeVisits", () => {
  it("ne compte rien sans page vue", () => {
    expect(summarizeVisits([])).toEqual({
      visits: 0,
      activeMs: 0,
      activeDays: 0,
    });
  });

  it("une page seule est une Visite sans durée", () => {
    expect(summarizeVisits([at("2026-10-01T10:00:00Z")])).toEqual({
      visits: 1,
      activeMs: 0,
      activeDays: 1,
    });
  });

  it("coupe une nouvelle Visite après plus de 30 minutes de pause", () => {
    const summary = summarizeVisits([
      at("2026-10-01T10:20:00Z"),
      at("2026-10-01T10:00:00Z"),
      at("2026-10-01T10:50:00Z"), // pause de 30 min pile : même Visite
      at("2026-10-01T11:21:00Z"), // pause de 31 min : nouvelle Visite
      at("2026-10-02T09:00:00Z"),
    ]);
    expect(summary.visits).toBe(3);
    expect(summary.activeMs).toBe(50 * 60 * 1000);
    expect(summary.activeDays).toBe(2);
  });
});
