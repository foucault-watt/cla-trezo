import { describe, it, expect, vi, beforeEach } from "vitest";

const { campaignFindManyMock, campaignFindUniqueMock, assoFindManyMock } =
  vi.hoisted(() => ({
    campaignFindManyMock: vi.fn(),
    campaignFindUniqueMock: vi.fn(),
    assoFindManyMock: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subventionCampaign: {
      findMany: campaignFindManyMock,
      findUnique: campaignFindUniqueMock,
    },
    asso: { findMany: assoFindManyMock },
  },
}));

const {
  listSubventionCampaigns,
  getSubventionCampaign,
  listAssosForSelect,
} = await import("./subvention-campaigns");

function campaign(overrides: Record<string, unknown> = {}) {
  return {
    id: "campaign-1",
    type: "CA_BUDGET",
    name: "Campagne CA Budget 2026",
    date: new Date("2026-09-01"),
    publicationDate: null,
    subventions: [],
    ...overrides,
  };
}

beforeEach(() => {
  campaignFindManyMock.mockReset();
  campaignFindUniqueMock.mockReset();
  assoFindManyMock.mockReset();
});

describe("listSubventionCampaigns", () => {
  it("calcule le statut dérivé et le montant total à partir des Subventions", async () => {
    const now = new Date();
    campaignFindManyMock.mockResolvedValue([
      campaign({
        publicationDate: new Date(now.getTime() - 86_400_000),
        subventions: [{ amountCents: 1000 }, { amountCents: 2500 }],
      }),
      campaign({ id: "campaign-2", publicationDate: null, subventions: [] }),
    ]);

    const result = await listSubventionCampaigns();

    expect(result[0].status).toBe("PUBLIEE");
    expect(result[0].totalAmountCents).toBe(3500);
    expect(result[0].subventionsCount).toBe(2);
    expect(result[1].status).toBe("PROGRAMMEE");
    expect(result[1].totalAmountCents).toBe(0);
  });
});

describe("getSubventionCampaign", () => {
  it("renvoie null si la campagne n'existe pas", async () => {
    campaignFindUniqueMock.mockResolvedValue(null);

    await expect(getSubventionCampaign("inexistante")).resolves.toBeNull();
  });

  it("renvoie le détail avec les Subventions et leur Structure", async () => {
    campaignFindUniqueMock.mockResolvedValue(
      campaign({
        subventions: [
          {
            id: "sub-1",
            reason: "Achat de matériel",
            amountCents: 5000,
            commentary: null,
            createdAt: new Date("2026-06-01"),
            asso: { id: "asso-1", name: "Club Info", slug: "club-info" },
          },
        ],
      }),
    );

    const result = await getSubventionCampaign("campaign-1");

    expect(result?.subventions).toEqual([
      {
        id: "sub-1",
        assoId: "asso-1",
        assoName: "Club Info",
        assoSlug: "club-info",
        reason: "Achat de matériel",
        amountCents: 5000,
        commentary: null,
        createdAt: new Date("2026-06-01"),
      },
    ]);
    expect(result?.totalAmountCents).toBe(5000);
  });
});

describe("listAssosForSelect", () => {
  it("renvoie les Structures triées par nom", async () => {
    assoFindManyMock.mockResolvedValue([{ id: "asso-1", name: "Club Info" }]);

    const result = await listAssosForSelect();

    expect(result).toEqual([{ id: "asso-1", name: "Club Info" }]);
    expect(assoFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: "asc" } }),
    );
  });
});
