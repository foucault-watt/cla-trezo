import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  validate: vi.fn(),
  syncUser: vi.fn(),
  syncAll: vi.fn(),
  log: vi.fn(),
  session: { user: undefined as unknown, save: vi.fn() },
}));
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: mocks.after,
}));
vi.mock("@/lib/auth/cla", () => ({
  ClaAuthError: class extends Error {},
  validateClaTicket: mocks.validate,
  syncUserFromCla: mocks.syncUser,
  syncAllAssociationsFromCla: mocks.syncAll,
}));
vi.mock("@/lib/prisma", () => ({ prisma: { userLog: { create: mocks.log } } }));
vi.mock("@/lib/session", () => ({ getSession: async () => mocks.session }));
import { GET } from "./route";

describe("connexion CLA et synchronisation après réponse", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.validate.mockResolvedValue({ isAdmin: true, allAssociations: [] });
    mocks.syncUser.mockResolvedValue({
      id: "admin",
      isAdmin: true,
      structures: [],
    });
  });
  const request = () =>
    new NextRequest("https://trezo.example/api/auth/cla/callback?ticket=ok");

  it("sauve la session et redirige sans attendre le catalogue, puis exécute la synchro différée", async () => {
    const response = await GET(request());
    expect(response.headers.get("location")).toBe(
      "https://trezo.example/app/admin",
    );
    expect(mocks.session.save).toHaveBeenCalledOnce();
    expect(mocks.syncAll).not.toHaveBeenCalled();
    expect(mocks.after).toHaveBeenCalledOnce();
    await mocks.after.mock.calls[0][0]();
    expect(mocks.syncAll).toHaveBeenCalledWith([]);
  });

  it("journalise un échec différé sans invalider la session", async () => {
    const error = new Error("indisponible");
    mocks.syncAll.mockRejectedValue(error);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await GET(request());
      await expect(mocks.after.mock.calls[0][0]()).resolves.toBeUndefined();
      expect(log).toHaveBeenCalledWith(
        "[CLA] Échec de la synchronisation complète :",
        error,
      );
      expect(mocks.session.user).toEqual({
        id: "admin",
        isAdmin: true,
        structures: [],
      });
    } finally {
      log.mockRestore();
    }
  });

  it("ne lance aucune synchro complète sans catalogue", async () => {
    mocks.validate.mockResolvedValue({ isAdmin: true });
    await GET(request());
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("ignore le catalogue pour un non-admin", async () => {
    mocks.syncUser.mockResolvedValue({
      id: "member",
      isAdmin: false,
      structures: [],
    });
    const response = await GET(request());
    expect(response.headers.get("location")).toBe("https://trezo.example/app");
    expect(mocks.after).not.toHaveBeenCalled();
  });
});
