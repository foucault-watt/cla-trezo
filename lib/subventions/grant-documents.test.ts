import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock, findUniqueMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireStructureAccess: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    grantDocument: { findMany: findManyMock, findUnique: findUniqueMock },
  },
}));

import {
  buildGrantDocumentFilename,
  findGrantDocumentForAsso,
  listGrantDocumentsForAsso,
} from "./grant-documents";

const now = new Date("2026-05-01T12:00:00Z");

beforeEach(() => {
  findManyMock.mockReset();
  findUniqueMock.mockReset();
});

describe("listGrantDocumentsForAsso", () => {
  it("ne liste que les documents de la Structure, Campagnes publiées", async () => {
    const generatedAt = new Date("2026-04-02T10:00:00Z");
    findManyMock.mockResolvedValue([
      {
        id: "doc-1",
        kind: "ORDRE_DE_FINANCEMENT",
        generatedAt,
        campaign: { name: "CA Event avril" },
      },
    ]);

    const documents = await listGrantDocumentsForAsso("asso-1", now);

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          assoId: "asso-1",
          campaign: { publicationDate: { not: null, lte: now } },
        },
      }),
    );
    expect(documents).toEqual([
      {
        id: "doc-1",
        kind: "ORDRE_DE_FINANCEMENT",
        campaignName: "CA Event avril",
        generatedAt,
      },
    ]);
  });
});

describe("findGrantDocumentForAsso", () => {
  const stored = {
    assoId: "asso-1",
    kind: "CONVENTION",
    filePath: "aeec/2026/octroi/campaign-1/doc.pdf",
    asso: { name: "AEEC Lille" },
    campaign: {
      name: "CA Budget 2026",
      publicationDate: new Date("2026-01-15T12:00:00Z"),
    },
  };

  it("sert le document de la Structure", async () => {
    findUniqueMock.mockResolvedValue(stored);

    expect(await findGrantDocumentForAsso("doc-1", "asso-1", now)).toEqual({
      filePath: stored.filePath,
      filename: "convention-de-subvention-aeec-lille-ca-budget-2026.pdf",
    });
  });

  it("refuse le document d'une autre Structure", async () => {
    findUniqueMock.mockResolvedValue(stored);

    expect(await findGrantDocumentForAsso("doc-1", "asso-2", now)).toBeNull();
  });

  it("refuse un document dont la Campagne n'est pas publiée", async () => {
    findUniqueMock.mockResolvedValue({
      ...stored,
      campaign: { ...stored.campaign, publicationDate: null },
    });

    expect(await findGrantDocumentForAsso("doc-1", "asso-1", now)).toBeNull();
  });

  it("renvoie null pour un document inexistant", async () => {
    findUniqueMock.mockResolvedValue(null);

    expect(await findGrantDocumentForAsso("doc-x", "asso-1", now)).toBeNull();
  });
});

describe("buildGrantDocumentFilename", () => {
  it("nomme un Ordre de financement d'après la Structure et la Campagne", () => {
    expect(
      buildGrantDocumentFilename({
        kind: "ORDRE_DE_FINANCEMENT",
        campaignName: "CA Événement d'avril",
        assoName: "CLIC",
      }),
    ).toBe("ordre-de-financement-clic-ca-evenement-d-avril.pdf");
  });
});
