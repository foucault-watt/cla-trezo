import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireAdminMock, updateMock, revalidatePathMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  updateMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({ prisma: { asso: { update: updateMock } } }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const { setAssoTypeAction } = await import("./asso-type");

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

const admin = {
  id: "admin-1",
  username: "admin",
  firstname: "Admin",
  lastname: "Trezo",
  isAdmin: true,
  structures: [],
};

const valid = {
  assoId: "11111111-1111-1111-8111-111111111111",
  assoSlug: "club-info",
  type: "CLUB",
};

beforeEach(() => {
  requireAdminMock.mockReset();
  updateMock.mockReset();
  revalidatePathMock.mockReset();
  requireAdminMock.mockResolvedValue(admin);
});

describe("setAssoTypeAction", () => {
  it("exige un Admin", async () => {
    await setAssoTypeAction({ ok: false }, formData(valid));

    expect(requireAdminMock).toHaveBeenCalled();
  });

  it("refuse une saisie invalide sans toucher à la base", async () => {
    const result = await setAssoTypeAction(
      { ok: false },
      formData({ ...valid, type: "AUTRE" }),
    );

    expect(result.ok).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("met à jour le Type de la Structure et revalide les pages", async () => {
    const result = await setAssoTypeAction({ ok: false }, formData(valid));

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: valid.assoId },
      data: { type: "CLUB" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/associations/${valid.assoSlug}`,
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/admin/associations");
    expect(result).toEqual({ ok: true });
  });

  it("fonctionne aussi bien pour la première classification que pour un changement ultérieur", async () => {
    const result = await setAssoTypeAction(
      { ok: false },
      formData({ ...valid, type: "ASSOCIATION_1901" }),
    );

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: valid.assoId },
      data: { type: "ASSOCIATION_1901" },
    });
    expect(result).toEqual({ ok: true });
  });
});
