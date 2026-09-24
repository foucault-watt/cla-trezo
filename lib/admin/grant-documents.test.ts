import { beforeEach, describe, expect, it, vi } from "vitest";

const { campaignFindUniqueMock, assoFindUniqueMock, settingsFindUniqueMock } =
  vi.hoisted(() => ({
    campaignFindUniqueMock: vi.fn(),
    assoFindUniqueMock: vi.fn(),
    settingsFindUniqueMock: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subventionCampaign: { findUnique: campaignFindUniqueMock },
    asso: { findUnique: assoFindUniqueMock },
    conventionPdfSettings: { findUnique: settingsFindUniqueMock },
  },
}));

import { defaultConventionPdfSettings } from "./convention-pdf-settings";
import {
  getGrantDocumentPreparation,
  grantDocumentKindForAssoType,
  isGrantDocumentStale,
  usageDeadlineFromGenerationDate,
} from "./grant-documents";

beforeEach(() => {
  campaignFindUniqueMock.mockReset();
  assoFindUniqueMock.mockReset();
  settingsFindUniqueMock.mockReset();
  settingsFindUniqueMock.mockResolvedValue(null);
});

describe("grantDocumentKindForAssoType", () => {
  it("associe le type de Structure au type de Document d'octroi", () => {
    expect(grantDocumentKindForAssoType("ASSOCIATION_1901")).toBe("CONVENTION");
    expect(grantDocumentKindForAssoType("CLUB")).toBe("ORDRE_DE_FINANCEMENT");
    expect(grantDocumentKindForAssoType("COMMISSION")).toBe(
      "ORDRE_DE_FINANCEMENT",
    );
    expect(grantDocumentKindForAssoType(null)).toBeNull();
  });
});

describe("usageDeadlineFromGenerationDate", () => {
  it("ajoute un an à la date de génération", () => {
    expect(
      usageDeadlineFromGenerationDate(new Date("2026-04-30T12:00:00+02:00")),
    ).toBe("30/04/2027");
  });

  it("utilise la date civile de Paris autour de minuit UTC", () => {
    // 31/12/2026 23:30 UTC = 01/01/2027 00:30 à Paris.
    expect(
      usageDeadlineFromGenerationDate(new Date("2026-12-31T23:30:00Z")),
    ).toBe("01/01/2028");
  });

  it("ramène un 29 février au 28 février de l'année suivante", () => {
    expect(
      usageDeadlineFromGenerationDate(new Date("2028-02-29T12:00:00+01:00")),
    ).toBe("28/02/2029");
  });
});

describe("isGrantDocumentStale", () => {
  const generatedAt = new Date("2026-05-01T10:00:00Z");
  const document = {
    kind: "ORDRE_DE_FINANCEMENT" as const,
    generatedAt,
    subventionCount: 2,
  };
  const before = new Date("2026-04-30T10:00:00Z");
  const after = new Date("2026-05-02T10:00:00Z");

  it("est à jour quand rien n'a changé depuis la génération", () => {
    expect(
      isGrantDocumentStale(document, {
        kind: "ORDRE_DE_FINANCEMENT",
        subventions: [{ updatedAt: before }, { updatedAt: before }],
      }),
    ).toBe(false);
  });

  it("est à régénérer après ajout ou modification d'une Subvention", () => {
    expect(
      isGrantDocumentStale(document, {
        kind: "ORDRE_DE_FINANCEMENT",
        subventions: [{ updatedAt: before }, { updatedAt: after }],
      }),
    ).toBe(true);
  });

  it("est à régénérer après suppression d'une Subvention", () => {
    expect(
      isGrantDocumentStale(document, {
        kind: "ORDRE_DE_FINANCEMENT",
        subventions: [{ updatedAt: before }],
      }),
    ).toBe(true);
  });

  it("est à régénérer quand le type de Structure a changé", () => {
    expect(
      isGrantDocumentStale(document, {
        kind: "CONVENTION",
        subventions: [{ updatedAt: before }, { updatedAt: before }],
      }),
    ).toBe(true);
  });
});

function mockCampaign() {
  campaignFindUniqueMock.mockResolvedValue({
    id: "campaign-1",
    name: "CA Event octobre",
    publicationDate: new Date("2025-10-15T12:00:00+02:00"),
    subventions: [
      { reason: "WEAC", amountCents: 65000 },
      { reason: "Journée de l'Institut", amountCents: 66000 },
    ],
    grantDocuments: [],
  });
}

function mockAsso(type: "CLUB" | "COMMISSION" | "ASSOCIATION_1901" | null) {
  assoFindUniqueMock.mockResolvedValue({
    id: "asso-1",
    name: "AEEC Lille",
    type,
    memberships: [
      {
        role: "Présidente",
        user: { firstname: "Yasmine", lastname: "Semiane" },
      },
    ],
  });
}

const generatedOn = new Date("2026-04-30T12:00:00+02:00");

describe("getGrantDocumentPreparation", () => {
  it("prépare une Convention regroupant toutes les Subventions, adresse bénéficiaire vide", async () => {
    mockCampaign();
    mockAsso("ASSOCIATION_1901");

    const preparation = await getGrantDocumentPreparation(
      "campaign-1",
      "asso-1",
      generatedOn,
    );

    expect(preparation?.kind).toBe("CONVENTION");
    if (preparation?.kind !== "CONVENTION") return;
    expect(preparation.data.period).toBe("2025-2026");
    expect(preparation.data.expenses).toEqual([
      { grantedOn: "15/10/2025", description: "WEAC", amount: "650,00 €" },
      {
        grantedOn: "15/10/2025",
        description: "Journée de l'Institut",
        amount: "660,00 €",
      },
    ]);
    expect(preparation.data.totalAmount).toBe("1 310,00 €");
    expect(preparation.data.secondParty.address).toBe("");
    expect(preparation.data.secondParty.representatives).toEqual([
      { name: "Yasmine SEMIANE", role: "Présidente" },
      { name: "", role: "Trésorier" },
    ]);
  });

  it("prépare un Ordre de financement pour un Club", async () => {
    mockCampaign();
    mockAsso("CLUB");

    const preparation = await getGrantDocumentPreparation(
      "campaign-1",
      "asso-1",
      generatedOn,
    );

    expect(preparation?.kind).toBe("ORDRE_DE_FINANCEMENT");
    if (preparation?.kind !== "ORDRE_DE_FINANCEMENT") return;
    expect(preparation.data).toEqual({
      period: "2025-2026",
      associationName: "AEEC Lille",
      associationStatus: "Club",
      requestContext: "financement lors du CA Event octobre",
      expenses: [
        { date: "15/10/2025", description: "WEAC", amount: "650,00 €" },
        {
          date: "15/10/2025",
          description: "Journée de l'Institut",
          amount: "660,00 €",
        },
      ],
      total: "1 310,00 €",
      usageDeadline: "30/04/2027",
      responsibleName: "Yasmine SEMIANE",
      secretaryName: defaultConventionPdfSettings.claSignatoryName,
    });
  });

  it("donne le statut Commission à une Commission", async () => {
    mockCampaign();
    mockAsso("COMMISSION");

    const preparation = await getGrantDocumentPreparation(
      "campaign-1",
      "asso-1",
      generatedOn,
    );

    expect(
      preparation?.kind === "ORDRE_DE_FINANCEMENT" &&
        preparation.data.associationStatus,
    ).toBe("Commission");
  });

  it("ne prépare aucun document tant que la Structure n'est pas classée", async () => {
    mockCampaign();
    mockAsso(null);

    const preparation = await getGrantDocumentPreparation(
      "campaign-1",
      "asso-1",
      generatedOn,
    );

    expect(preparation?.kind).toBeNull();
    expect(preparation && "data" in preparation).toBe(false);
  });

  it("renvoie null quand la Structure n'a aucune Subvention dans la Campagne", async () => {
    campaignFindUniqueMock.mockResolvedValue({
      id: "campaign-1",
      name: "CA Event octobre",
      publicationDate: null,
      subventions: [],
      grantDocuments: [],
    });
    mockAsso("CLUB");

    expect(
      await getGrantDocumentPreparation("campaign-1", "asso-1", generatedOn),
    ).toBeNull();
  });
});
