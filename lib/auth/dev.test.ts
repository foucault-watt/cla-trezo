import { describe, expect, it } from "vitest";
import { buildDefaultDevUser } from "./dev";

describe("buildDefaultDevUser", () => {
  it("donne à l'agent de développement accès à toutes les assos", () => {
    const user = buildDefaultDevUser([
      { id: "asso-1", slug: "alpha", name: "Alpha" },
      { id: "asso-2", slug: "beta", name: "Beta" },
    ]);

    expect(user.isAdmin).toBe(true);
    expect(user.structures).toEqual([
      {
        assoId: "asso-1",
        slug: "alpha",
        name: "Alpha",
        role: "Accès développement",
      },
      {
        assoId: "asso-2",
        slug: "beta",
        name: "Beta",
        role: "Accès développement",
      },
    ]);
  });
});
