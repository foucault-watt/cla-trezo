import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SessionUser } from "@/lib/session";

const { getSessionMock, findUniqueMock, redirectMock, notFoundMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  findUniqueMock: vi.fn(),
  redirectMock: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
  notFoundMock: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("@/lib/session", () => ({ getSession: getSessionMock }));
vi.mock("@/lib/prisma", () => ({ prisma: { asso: { findUnique: findUniqueMock } } }));
vi.mock("next/navigation", () => ({ redirect: redirectMock, notFound: notFoundMock }));

const { requireStructureAccess, requireUser } = await import("./guards");

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

beforeEach(() => {
  getSessionMock.mockReset();
  findUniqueMock.mockReset();
  redirectMock.mockClear();
  notFoundMock.mockClear();
});

describe("requireStructureAccess", () => {
  it("redirige vers /login si non connecté", async () => {
    getSessionMock.mockResolvedValue({ user: undefined });

    await expect(requireStructureAccess("cla")).rejects.toThrow("REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/login");
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("renvoie 404 si la Structure ne fait pas partie des memberships de l'utilisateur", async () => {
    getSessionMock.mockResolvedValue({ user: member });

    await expect(requireStructureAccess("une-autre-structure")).rejects.toThrow("NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("laisse passer un membre sur sa propre Structure", async () => {
    getSessionMock.mockResolvedValue({ user: member });

    const result = await requireStructureAccess("cla");

    expect(result).toEqual({
      structure: { assoId: "asso-cla", slug: "cla", name: "CLA", role: "membre" },
      user: member,
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("laisse passer un Admin sur n'importe quelle Structure existante", async () => {
    getSessionMock.mockResolvedValue({ user: admin });
    findUniqueMock.mockResolvedValue({ id: "asso-other", name: "Autre Structure" });

    const result = await requireStructureAccess("une-autre-structure");

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { slug: "une-autre-structure" },
      select: { id: true, name: true },
    });
    expect(result).toEqual({
      structure: { assoId: "asso-other", slug: "une-autre-structure", name: "Autre Structure", role: null },
      user: admin,
    });
  });

  it("renvoie 404 pour un Admin sur une Structure inexistante", async () => {
    getSessionMock.mockResolvedValue({ user: admin });
    findUniqueMock.mockResolvedValue(null);

    await expect(requireStructureAccess("inexistante")).rejects.toThrow("NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalled();
  });
});

describe("requireUser", () => {
  it("redirige vers /login si non connecté", async () => {
    getSessionMock.mockResolvedValue({ user: undefined });

    await expect(requireUser()).rejects.toThrow("REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("renvoie l'utilisateur si connecté", async () => {
    getSessionMock.mockResolvedValue({ user: member });

    await expect(requireUser()).resolves.toEqual(member);
  });
});
