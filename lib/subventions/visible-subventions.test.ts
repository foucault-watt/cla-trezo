import { describe, it, expect, vi, beforeEach } from "vitest";

const { requireStructureAccessMock, findManyMock } = vi.hoisted(() => ({
  requireStructureAccessMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireStructureAccess: requireStructureAccessMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { subvention: { findMany: findManyMock } },
}));

const { listVisibleSubventions } = await import("./visible-subventions");

beforeEach(() => {
  requireStructureAccessMock.mockReset();
  findManyMock.mockReset();
  requireStructureAccessMock.mockResolvedValue({
    structure: { assoId: "asso-1", slug: "club-info", name: "Club Info" },
    user: { id: "user-1" },
  });
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

  it("mappe chaque Subvention en vue avec montant utilisé à 0 et montant restant égal au total", async () => {
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
        },
      },
    ]);

    const result = await listVisibleSubventions("club-info");

    expect(result).toEqual([
      {
        id: "sub-1",
        campaignName: "Campagne CA Budget 2026",
        type: "CA_BUDGET",
        reason: "Achat de matériel",
        totalAmountCents: 5000,
        usedAmountCents: 0,
        remainingAmountCents: 5000,
        commentary: "RAS",
        publicationDate: new Date("2026-01-01"),
      },
    ]);
  });
});
