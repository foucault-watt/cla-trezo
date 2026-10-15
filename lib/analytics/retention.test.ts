import { describe, expect, it } from "vitest";
import { analyticsCutoff, auditCutoff } from "./retention";

describe("analyticsCutoff", () => {
  it("garde 13 mois entiers avant le mois en cours", () => {
    expect(analyticsCutoff(new Date("2026-10-15T12:00:00Z"))).toEqual(
      new Date("2025-09-01T00:00:00Z"),
    );
  });

  it("franchit l'année en janvier", () => {
    expect(analyticsCutoff(new Date("2027-01-01T00:00:00Z"))).toEqual(
      new Date("2025-12-01T00:00:00Z"),
    );
  });
});

describe("auditCutoff", () => {
  it("garde 10 ans de journal d'audit", () => {
    expect(auditCutoff(new Date("2026-10-15T12:00:00Z"))).toEqual(
      new Date("2016-10-15T12:00:00Z"),
    );
  });
});
