import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireStructureAccessMock,
  requireAdminMock,
  findUniqueOrThrowMock,
  findManyMock,
} = vi.hoisted(() => ({
  requireStructureAccessMock: vi.fn(),
  requireAdminMock: vi.fn(),
  findUniqueOrThrowMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireStructureAccess: requireStructureAccessMock,
  requireAdmin: requireAdminMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    asso: { findUniqueOrThrow: findUniqueOrThrowMock },
    financialMovement: { findMany: findManyMock },
  },
}));

const { getClubSolde, getClubSoldeForAdmin } = await import("./actions");

const structure = {
  assoId: "asso-club",
  slug: "club-info",
  name: "Club Info",
  role: "membre",
};

beforeEach(() => {
  requireStructureAccessMock.mockReset();
  requireAdminMock.mockReset();
  findUniqueOrThrowMock.mockReset();
  findManyMock.mockReset();
  requireStructureAccessMock.mockResolvedValue({
    structure,
    user: { id: "user-1" },
  });
  requireAdminMock.mockResolvedValue({ id: "admin-1", isAdmin: true });
});

describe("getClubSolde", () => {
  it("délègue le contrôle d'accès à requireStructureAccess", async () => {
    findUniqueOrThrowMock.mockResolvedValue({ type: "CLUB" });
    findManyMock.mockResolvedValue([]);

    await getClubSolde("club-info");

    expect(requireStructureAccessMock).toHaveBeenCalledWith("club-info");
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assoId: "asso-club", accountType: "CLUB_BALANCE" },
      }),
    );
  });

  it("renvoie not_applicable pour une Commission, sans même regarder les mouvements", async () => {
    findUniqueOrThrowMock.mockResolvedValue({ type: "COMMISSION" });
    findManyMock.mockResolvedValue([{ id: "mov-1" }]);

    const result = await getClubSolde("commission-x");

    expect(result).toEqual({ status: "not_applicable" });
  });

  it("renvoie not_initialized pour un Club sans mouvement MANUAL", async () => {
    findUniqueOrThrowMock.mockResolvedValue({ type: "CLUB" });
    findManyMock.mockResolvedValue([
      {
        id: "mov-1",
        movementType: "DEBIT",
        amountCents: 100,
        origin: "EXPENSE_REPORT",
        category: null,
        description: null,
        createdAt: new Date("2026-01-01"),
      },
    ]);

    const result = await getClubSolde("club-info");

    expect(result).toEqual({ status: "not_initialized" });
  });

  it("renvoie le solde calculé et l'historique pour un Club initialisé", async () => {
    findUniqueOrThrowMock.mockResolvedValue({ type: "CLUB" });
    findManyMock.mockResolvedValue([
      {
        id: "mov-1",
        movementType: "CREDIT",
        amountCents: 5000,
        origin: "MANUAL",
        category: null,
        description: "Solde initial",
        createdAt: new Date("2026-01-01"),
      },
    ]);

    const result = await getClubSolde("club-info");

    expect(result).toEqual({
      status: "ready",
      balanceCents: 5000,
      movements: [
        {
          id: "mov-1",
          movementType: "CREDIT",
          amountCents: 5000,
          origin: "MANUAL",
          category: null,
          description: "Solde initial",
          createdAt: new Date("2026-01-01"),
        },
      ],
    });
  });
});

describe("getClubSoldeForAdmin", () => {
  it("délègue le contrôle d'accès à requireAdmin et scope directement par assoId (#18)", async () => {
    findUniqueOrThrowMock.mockResolvedValue({ type: "CLUB" });
    findManyMock.mockResolvedValue([]);

    await getClubSoldeForAdmin("asso-club");

    expect(requireAdminMock).toHaveBeenCalled();
    expect(requireStructureAccessMock).not.toHaveBeenCalled();
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assoId: "asso-club", accountType: "CLUB_BALANCE" },
      }),
    );
  });

  it("renvoie le même calcul de Solde que getClubSolde pour un Club initialisé", async () => {
    findUniqueOrThrowMock.mockResolvedValue({ type: "CLUB" });
    findManyMock.mockResolvedValue([
      {
        id: "mov-1",
        movementType: "CREDIT",
        amountCents: 5000,
        origin: "MANUAL",
        category: null,
        description: "Solde initial",
        createdAt: new Date("2026-01-01"),
      },
    ]);

    const result = await getClubSoldeForAdmin("asso-club");

    expect(result).toEqual({
      status: "ready",
      balanceCents: 5000,
      movements: [
        {
          id: "mov-1",
          movementType: "CREDIT",
          amountCents: 5000,
          origin: "MANUAL",
          category: null,
          description: "Solde initial",
          createdAt: new Date("2026-01-01"),
        },
      ],
    });
  });
});
