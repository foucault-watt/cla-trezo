import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireStructureAccessMock,
  requireAdminMock,
  findManyMock,
  financialMovementFindManyMock,
} = vi.hoisted(() => ({
  requireStructureAccessMock: vi.fn(),
  requireAdminMock: vi.fn(),
  findManyMock: vi.fn(),
  financialMovementFindManyMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireStructureAccess: requireStructureAccessMock,
  requireAdmin: requireAdminMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    subvention: { findMany: findManyMock },
    financialMovement: { findMany: financialMovementFindManyMock },
  },
}));

const { listVisibleSubventions, listVisibleSubventionsForAdmin } =
  await import("./visible-subventions");

beforeEach(() => {
  requireStructureAccessMock.mockReset();
  requireAdminMock.mockReset();
  findManyMock.mockReset();
  financialMovementFindManyMock.mockReset();
  financialMovementFindManyMock.mockResolvedValue([]);
  requireStructureAccessMock.mockResolvedValue({
    structure: { assoId: "asso-1", slug: "club-info", name: "Club Info" },
    user: { id: "user-1" },
  });
  requireAdminMock.mockResolvedValue({ id: "admin-1", isAdmin: true });
});

describe("listVisibleSubventions", () => {
  it("délègue le scoping par Structure à requireStructureAccess", async () => {
    findManyMock.mockResolvedValue([]);

    await listVisibleSubventions("club-info");

    expect(requireStructureAccessMock).toHaveBeenCalledWith("club-info");
  });

  it("ne interroge que les Subventions dont la Campagne est publiée pour cette Association", async () => {
    findManyMock.mockResolvedValue([]);

    await listVisibleSubventions("club-info");

    const call = findManyMock.mock.calls[0][0];
    expect(call.where.assoId).toBe("asso-1");
    expect(call.where.campaign.publicationDate).toEqual(
      expect.objectContaining({ not: null }),
    );
  });

  it("mappe chaque Subvention en vue avec le montant utilisé calculé depuis les mouvements Validés", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "sub-1",
        reason: "Achat de matériel",
        amountCents: 5000,
        commentary: "RAS",
        campaign: {
          name: "Campagne CA Budget 2026",
          type: "CA_BUDGET",
          publicationDate: new Date("2026-01-01"),
          date: new Date("2026-01-01"),
        },
      },
    ]);
    financialMovementFindManyMock.mockResolvedValue([
      { subventionId: "sub-1", movementType: "DEBIT", amountCents: 1500 },
    ]);

    const result = await listVisibleSubventions("club-info");

    expect(result).toEqual([
      {
        id: "sub-1",
        campaignName: "Campagne CA Budget 2026",
        type: "CA_BUDGET",
        reason: "Achat de matériel",
        totalAmountCents: 5000,
        usedAmountCents: 1500,
        remainingAmountCents: 3500,
        commentary: "RAS",
        publicationDate: new Date("2026-01-01"),
        campaignDate: new Date("2026-01-01"),
        stale: false,
      },
    ]);
  });

  it("flague stale une Subvention dont la Campagne date de plus d'un an", async () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    findManyMock.mockResolvedValue([
      {
        id: "sub-2",
        reason: "Vieux projet",
        amountCents: 2000,
        commentary: null,
        campaign: {
          name: "Campagne CA Event 2024",
          type: "CA_EVENT",
          publicationDate: new Date("2024-01-01"),
          date: twoYearsAgo,
        },
      },
    ]);

    const result = await listVisibleSubventions("club-info");

    expect(result[0].stale).toBe(true);
  });
});

describe("listVisibleSubventionsForAdmin", () => {
  it("délègue le contrôle d'accès à requireAdmin et scope directement par assoId (#18)", async () => {
    findManyMock.mockResolvedValue([]);

    await listVisibleSubventionsForAdmin("asso-1");

    expect(requireAdminMock).toHaveBeenCalled();
    expect(requireStructureAccessMock).not.toHaveBeenCalled();
    const call = findManyMock.mock.calls[0][0];
    expect(call.where.assoId).toBe("asso-1");
  });
});
