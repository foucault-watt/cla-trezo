import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireAdminMock, findUniqueMock, createMock, revalidatePathMock } =
  vi.hoisted(() => ({
    requireAdminMock: vi.fn(),
    findUniqueMock: vi.fn(),
    createMock: vi.fn(),
    revalidatePathMock: vi.fn(),
  }));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    asso: { findUnique: findUniqueMock },
    financialMovement: { create: createMock },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const { addManualMovementAction } = await import("./movements");

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
  movementType: "CREDIT",
  amount: "150.50",
  description: "Solde initial de l'année",
  date: "2026-01-15",
};

beforeEach(() => {
  requireAdminMock.mockReset();
  findUniqueMock.mockReset();
  createMock.mockReset();
  revalidatePathMock.mockReset();
  requireAdminMock.mockResolvedValue(admin);
});

describe("addManualMovementAction", () => {
  it("exige un Admin (délégué à requireAdmin)", async () => {
    findUniqueMock.mockResolvedValue({ type: "CLUB" });

    await addManualMovementAction({ ok: false }, formData(valid));

    expect(requireAdminMock).toHaveBeenCalled();
  });

  it("refuse une saisie invalide sans toucher à la base", async () => {
    const result = await addManualMovementAction(
      { ok: false },
      formData({ ...valid, amount: "-5" }),
    );

    expect(result.ok).toBe(false);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("refuse le mouvement si la Structure n'est pas un Club", async () => {
    findUniqueMock.mockResolvedValue({ type: "COMMISSION" });

    const result = await addManualMovementAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Seuls les Clubs ont un Solde.",
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("refuse le mouvement si la Structure n'existe pas", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await addManualMovementAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Seuls les Clubs ont un Solde.",
    });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("crée un FinancialMovement MANUAL/CLUB_BALANCE pour un Club et revalide les pages", async () => {
    findUniqueMock.mockResolvedValue({ type: "CLUB" });

    const result = await addManualMovementAction(
      { ok: false },
      formData(valid),
    );

    expect(createMock).toHaveBeenCalledWith({
      data: {
        assoId: valid.assoId,
        movementType: "CREDIT",
        accountType: "CLUB_BALANCE",
        origin: "MANUAL",
        amountCents: 15050,
        description: valid.description,
        createdBy: admin.id,
        createdAt: new Date(valid.date),
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/associations/${valid.assoSlug}`,
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/admin/associations");
    expect(result).toEqual({ ok: true });
  });

  it("enregistre le mouvement à la date choisie par l'admin, pas à la date de saisie", async () => {
    findUniqueMock.mockResolvedValue({ type: "CLUB" });

    await addManualMovementAction(
      { ok: false },
      formData({ ...valid, date: "2019-05-20" }),
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ createdAt: new Date("2019-05-20") }),
      }),
    );
  });
});
