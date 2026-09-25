import { describe, it, expect } from "vitest";
import { groupByYear, splitRecentAndHistorique } from "./year-grouping";

type Item = { id: string; date: Date; amountCents: number };

const item = (id: string, iso: string, amountCents = 0): Item => ({
  id,
  date: new Date(iso),
  amountCents,
});

describe("splitRecentAndHistorique", () => {
  const now = new Date("2026-03-15T12:00:00");

  it("garde l'année en cours et la précédente dans les récents", () => {
    const items = [
      item("a", "2026-01-10T12:00:00"),
      item("b", "2025-01-01T12:00:00"),
      item("c", "2024-12-31T12:00:00"),
      item("d", "2020-06-01T12:00:00"),
    ];

    const result = splitRecentAndHistorique(items, (i) => i.date, now);

    expect(result.cutoffYear).toBe(2025);
    expect(result.recent.map((i) => i.id)).toEqual(["a", "b"]);
    expect(result.historique.map((i) => i.id)).toEqual(["c", "d"]);
  });

  it("renvoie des listes vides pour une entrée vide", () => {
    expect(splitRecentAndHistorique([], (i: Item) => i.date, now)).toEqual({
      recent: [],
      historique: [],
      cutoffYear: 2025,
    });
  });
});

describe("groupByYear", () => {
  it("regroupe par année, la plus récente en tête, avec le total de chaque année", () => {
    const items = [
      item("a", "2024-05-01T12:00:00", 1000),
      item("b", "2026-02-01T12:00:00", 250),
      item("c", "2024-11-01T12:00:00", 500),
      item("d", "2026-07-01T12:00:00", 750),
    ];

    const groups = groupByYear(items, (i) => i.date, (i) => i.amountCents);

    expect(groups.map((g) => g.year)).toEqual([2026, 2024]);
    expect(groups.map((g) => g.totalCents)).toEqual([1000, 1500]);
  });

  it("trie les éléments de chaque année du plus récent au plus ancien sans muter l'entrée", () => {
    const items = [
      item("a", "2026-01-01T12:00:00"),
      item("b", "2026-09-01T12:00:00"),
      item("c", "2026-04-01T12:00:00"),
    ];

    const [group] = groupByYear(items, (i) => i.date, (i) => i.amountCents);

    expect(group.items.map((i) => i.id)).toEqual(["b", "c", "a"]);
    expect(items.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
});
