import { describe, it, expect, vi } from "vitest";
import { resolveStructureAccess } from "./access";
import type { SessionUser } from "@/lib/session";

const member: SessionUser = {
  id: "user-1",
  username: "jdupont",
  firstname: "Jean",
  lastname: "Dupont",
  isAdmin: false,
  structures: [{ assoId: "asso-cla", slug: "cla", name: "CLA", role: "membre" }],
};

const admin: SessionUser = {
  id: "user-2",
  username: "admin",
  firstname: "Admin",
  lastname: "Trezo",
  isAdmin: true,
  structures: [],
};

describe("resolveStructureAccess", () => {
  it("refuse l'accès si l'utilisateur n'est pas connecté", async () => {
    const lookupAsso = vi.fn();

    const result = await resolveStructureAccess(undefined, "cla", lookupAsso);

    expect(result).toEqual({ ok: false, reason: "unauthenticated" });
    expect(lookupAsso).not.toHaveBeenCalled();
  });

  it("refuse l'accès d'un membre à une Structure dont il n'est pas membre", async () => {
    const lookupAsso = vi.fn().mockResolvedValue(null);

    const result = await resolveStructureAccess(member, "une-autre-structure", lookupAsso);

    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  it("autorise un membre sur sa propre Structure", async () => {
    const lookupAsso = vi.fn();

    const result = await resolveStructureAccess(member, "cla", lookupAsso);

    expect(result).toEqual({
      ok: true,
      assoId: "asso-cla",
      slug: "cla",
      name: "CLA",
      role: "membre",
    });
    expect(lookupAsso).not.toHaveBeenCalled();
  });

  it("autorise un Admin sur n'importe quelle Structure existante", async () => {
    const lookupAsso = vi.fn().mockResolvedValue({ id: "asso-other", name: "Autre Structure" });

    const result = await resolveStructureAccess(admin, "une-autre-structure", lookupAsso);

    expect(lookupAsso).toHaveBeenCalledWith("une-autre-structure");
    expect(result).toEqual({
      ok: true,
      assoId: "asso-other",
      slug: "une-autre-structure",
      name: "Autre Structure",
      role: null,
    });
  });

  it("refuse un Admin sur une Structure qui n'existe pas", async () => {
    const lookupAsso = vi.fn().mockResolvedValue(null);

    const result = await resolveStructureAccess(admin, "inexistante", lookupAsso);

    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });
});
