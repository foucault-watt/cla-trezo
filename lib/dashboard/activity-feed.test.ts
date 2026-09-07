import { describe, it, expect } from "vitest";
import { groupByYear, mergeActivityEvents } from "./activity-feed";

describe("mergeActivityEvents", () => {
  it("trie par date décroissante", () => {
    const result = mergeActivityEvents([
      { id: "a", date: new Date("2026-01-01") },
      { id: "b", date: new Date("2026-03-01") },
      { id: "c", date: new Date("2026-02-01") },
    ]);

    expect(result.map((e) => e.id)).toEqual(["b", "c", "a"]);
  });

  it("ne mute pas le tableau reçu", () => {
    const events = [
      { id: "a", date: new Date("2026-01-01") },
      { id: "b", date: new Date("2026-03-01") },
    ];

    mergeActivityEvents(events);

    expect(events.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("groupByYear", () => {
  it("regroupe par année, la plus récente en premier", () => {
    const result = groupByYear(
      [
        { id: "m1", createdAt: new Date("2026-03-01") },
        { id: "m2", createdAt: new Date("2025-06-01") },
        { id: "m3", createdAt: new Date("2024-01-01") },
      ],
      (m) => m.createdAt,
    );

    expect(result.map((g) => g.key)).toEqual(["2026", "2025", "2024"]);
    expect(result[0].items.map((i) => i.id)).toEqual(["m1"]);
  });

  it("regroupe plusieurs éléments de la même année sous la même clé", () => {
    const result = groupByYear(
      [
        { id: "m1", createdAt: new Date("2026-03-01") },
        { id: "m2", createdAt: new Date("2026-01-01") },
      ],
      (m) => m.createdAt,
    );

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("2026");
    expect(result[0].items).toHaveLength(2);
  });

  it("renvoie un tableau vide pour une liste vide", () => {
    expect(groupByYear([], (m: { createdAt: Date }) => m.createdAt)).toEqual(
      [],
    );
  });
});
