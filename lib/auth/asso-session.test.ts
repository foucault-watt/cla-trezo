import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionMock, getDemoSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  getDemoSessionMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
  getDemoSession: getDemoSessionMock,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { getSessionUserForAsso } = await import("./asso-session");

const realUser = { id: "user-1", isAdmin: true, structures: [] };
const demoUser = { id: "user-demo", isAdmin: false, isDemo: true, structures: [] };

beforeEach(() => {
  getSessionMock.mockReset();
  getDemoSessionMock.mockReset();
  getSessionMock.mockResolvedValue({ user: realUser });
  getDemoSessionMock.mockResolvedValue({ user: demoUser });
});

describe("getSessionUserForAsso", () => {
  it("lit la vraie session pour une Asso réelle", async () => {
    expect(await getSessionUserForAsso("club-info")).toBe(realUser);
    expect(getDemoSessionMock).not.toHaveBeenCalled();
  });

  it("lit le cookie démo pour l'Asso démo, jamais la vraie session", async () => {
    expect(await getSessionUserForAsso("club-demo")).toBe(demoUser);
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it("ne retombe pas sur la vraie session (même Admin) sans cookie démo", async () => {
    getDemoSessionMock.mockResolvedValue({});

    expect(await getSessionUserForAsso("club-demo")).toBeUndefined();
  });
});
