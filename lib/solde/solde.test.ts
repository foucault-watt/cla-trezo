import { describe, it, expect } from "vitest";
import { computeSolde, type SoldeMovement } from "./solde";

function movement(overrides: Partial<SoldeMovement>): SoldeMovement {
  return {
    id: "mov-1",
    movementType: "CREDIT",
    amountCents: 1000,
    origin: "MANUAL",
    category: null,
    description: null,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("computeSolde", () => {
  it("n'existe pas tant que le Type de la Structure n'est pas classifié par un Admin", () => {
    expect(computeSolde(null, [])).toEqual({ status: "type_undefined" });
  });

  it("n'existe pas pour une Commission", () => {
    expect(computeSolde("COMMISSION", [])).toEqual({
      status: "not_applicable",
    });
  });

  it("n'existe pas pour une Association loi 1901", () => {
    expect(computeSolde("ASSOCIATION_1901", [])).toEqual({
      status: "not_applicable",
    });
  });

  it("n'est pas initialisé pour un Club sans mouvement", () => {
    expect(computeSolde("CLUB", [])).toEqual({ status: "not_initialized" });
  });

  it("n'est pas initialisé pour un Club avec seulement des mouvements EXPENSE_REPORT", () => {
    const movements = [
      movement({ origin: "EXPENSE_REPORT", movementType: "DEBIT" }),
    ];

    expect(computeSolde("CLUB", movements)).toEqual({
      status: "not_initialized",
    });
  });

  it("est initialisé dès qu'un mouvement MANUAL existe, solde calculé à la volée", () => {
    const movements = [
      movement({
        id: "m1",
        movementType: "CREDIT",
        amountCents: 5000,
        origin: "MANUAL",
      }),
      movement({
        id: "m2",
        movementType: "DEBIT",
        amountCents: 1200,
        origin: "EXPENSE_REPORT",
      }),
    ];

    const result = computeSolde("CLUB", movements);

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.balanceCents).toBe(3800);
    }
  });

  it("trie les mouvements du plus récent au plus ancien", () => {
    const movements = [
      movement({
        id: "old",
        origin: "MANUAL",
        createdAt: new Date("2026-01-01"),
      }),
      movement({
        id: "new",
        origin: "MANUAL",
        createdAt: new Date("2026-03-01"),
      }),
      movement({
        id: "mid",
        origin: "MANUAL",
        createdAt: new Date("2026-02-01"),
      }),
    ];

    const result = computeSolde("CLUB", movements);

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.movements.map((m) => m.id)).toEqual(["new", "mid", "old"]);
    }
  });
});
