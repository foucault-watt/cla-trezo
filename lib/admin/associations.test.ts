import { describe, it, expect, vi, beforeEach } from "vitest";

const { findManyMock, findUniqueMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { asso: { findMany: findManyMock, findUnique: findUniqueMock } },
}));

const { listAssociations, getAssociationOverview } =
  await import("./associations");

function asso(overrides: Record<string, unknown> = {}) {
  return {
    id: "asso-1",
    slug: "club-info",
    name: "Club Info",
    type: "CLUB",
    status: "ACTIVE",
    financialMovements: [],
    _count: { subventions: 2, expenseReports: 1 },
    ...overrides,
  };
}

beforeEach(() => {
  findManyMock.mockReset();
  findUniqueMock.mockReset();
});

describe("listAssociations", () => {
  it("mappe chaque Asso vers une vue d'ensemble avec le Solde calculé", async () => {
    findManyMock.mockResolvedValue([
      asso({
        financialMovements: [
          {
            id: "m1",
            movementType: "CREDIT",
            amountCents: 1000,
            origin: "MANUAL",
            category: null,
            description: null,
            createdAt: new Date(),
          },
        ],
      }),
      asso({
        id: "asso-2",
        slug: "commission-x",
        type: "COMMISSION",
        financialMovements: [],
      }),
    ]);

    const result = await listAssociations();

    expect(result[0].solde).toEqual({
      status: "ready",
      balanceCents: 1000,
      movements: expect.any(Array),
    });
    expect(result[0].subventionsPubliees).toBe(2);
    expect(result[0].notesDeFraisEnAttente).toBe(1);
    expect(result[1].solde).toEqual({ status: "not_applicable" });
  });

  it("renvoie type_undefined pour une Structure sans Type encore classifié par un Admin", async () => {
    findManyMock.mockResolvedValue([asso({ type: null })]);

    const result = await listAssociations();

    expect(result[0].type).toBeNull();
    expect(result[0].solde).toEqual({ status: "type_undefined" });
  });

  it("compte les Subventions dont la campagne est publiée, et les Notes de frais Soumise/Prise en charge", async () => {
    findManyMock.mockResolvedValue([asso()]);

    await listAssociations();

    const call = findManyMock.mock.calls[0][0];
    expect(
      call.include._count.select.subventions.where.campaign.publicationDate,
    ).toEqual(expect.objectContaining({ not: null }));
    expect(call.include._count.select.expenseReports.where.status.in).toEqual([
      "SUBMITTED",
      "TAKEN_OVER",
    ]);
  });
});

describe("getAssociationOverview", () => {
  it("renvoie null si la Structure n'existe pas", async () => {
    findUniqueMock.mockResolvedValue(null);

    await expect(getAssociationOverview("inexistante")).resolves.toBeNull();
  });

  it("renvoie la vue d'ensemble pour une Structure existante", async () => {
    findUniqueMock.mockResolvedValue(asso());

    const result = await getAssociationOverview("club-info");

    expect(result?.slug).toBe("club-info");
    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "club-info" } }),
    );
  });
});
