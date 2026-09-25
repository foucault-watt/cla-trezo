import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatCentsForPdf } from "@/lib/money";
import { fixture as conventionFixture } from "@/pdf-lab/templates/convention/fixture";
import { fixture as financementFixture } from "@/pdf-lab/templates/financement/fixture";

const {
  requireAdminMock,
  campaignFindUniqueMock,
  assoFindUniqueMock,
  grantDocumentUpsertMock,
  revalidatePathMock,
  buildGrantDocumentPathMock,
  writeStoredFileMock,
  deleteStoredFileMock,
  renderConventionPdfMock,
  renderOrdreDeFinancementPdfMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  campaignFindUniqueMock: vi.fn(),
  assoFindUniqueMock: vi.fn(),
  grantDocumentUpsertMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  buildGrantDocumentPathMock: vi.fn(),
  writeStoredFileMock: vi.fn(),
  deleteStoredFileMock: vi.fn(),
  renderConventionPdfMock: vi.fn(),
  renderOrdreDeFinancementPdfMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    subventionCampaign: { findUnique: campaignFindUniqueMock },
    asso: { findUnique: assoFindUniqueMock },
    grantDocument: { upsert: grantDocumentUpsertMock },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/storage/file-storage", () => ({
  buildGrantDocumentPath: buildGrantDocumentPathMock,
  writeStoredFile: writeStoredFileMock,
  deleteStoredFile: deleteStoredFileMock,
}));
vi.mock("./render-grant-document", () => ({
  renderConventionPdf: renderConventionPdfMock,
  renderOrdreDeFinancementPdf: renderOrdreDeFinancementPdfMock,
}));

const { generateGrantDocumentAction } =
  await import("./generate-grant-document-action");

const NEW_PATH = "club-info/2026/octroi/campaign-1/new.pdf";
const OLD_PATH = "club-info/2026/octroi/campaign-1/old.pdf";

function campaign(
  overrides: Partial<{
    publicationDate: Date | null;
    subventions: { id: string }[];
    grantDocuments: { id: string; filePath: string }[];
  }> = {},
) {
  return {
    id: "campaign-1",
    publicationDate: new Date("2026-01-15T12:00:00Z"),
    subventions: [{ id: "sub-1" }, { id: "sub-2" }],
    grantDocuments: [],
    ...overrides,
  };
}

function asso(type: "CLUB" | "COMMISSION" | "ASSOCIATION_1901" | null) {
  return { id: "asso-1", slug: "club-info", type };
}

beforeEach(() => {
  requireAdminMock.mockReset().mockResolvedValue({ id: "admin-1" });
  campaignFindUniqueMock.mockReset().mockResolvedValue(campaign());
  assoFindUniqueMock.mockReset().mockResolvedValue(asso("CLUB"));
  grantDocumentUpsertMock.mockReset().mockResolvedValue({ id: "doc-1" });
  revalidatePathMock.mockReset();
  buildGrantDocumentPathMock.mockReset().mockReturnValue(NEW_PATH);
  writeStoredFileMock.mockReset().mockResolvedValue(undefined);
  deleteStoredFileMock.mockReset().mockResolvedValue(undefined);
  renderConventionPdfMock
    .mockReset()
    .mockResolvedValue(Buffer.from("pdf-convention"));
  renderOrdreDeFinancementPdfMock
    .mockReset()
    .mockResolvedValue(Buffer.from("pdf-ordre"));
});

function expectNothingWritten() {
  expect(renderConventionPdfMock).not.toHaveBeenCalled();
  expect(renderOrdreDeFinancementPdfMock).not.toHaveBeenCalled();
  expect(writeStoredFileMock).not.toHaveBeenCalled();
  expect(grantDocumentUpsertMock).not.toHaveBeenCalled();
}

describe("generateGrantDocumentAction", () => {
  it("génère et stocke un Ordre de financement pour un Club", async () => {
    const result = await generateGrantDocumentAction(
      "campaign-1",
      "asso-1",
      financementFixture,
    );

    expect(result).toEqual({ ok: true, documentId: "doc-1" });
    expect(renderOrdreDeFinancementPdfMock).toHaveBeenCalledWith(
      financementFixture,
    );
    expect(renderConventionPdfMock).not.toHaveBeenCalled();
    expect(writeStoredFileMock).toHaveBeenCalledWith(
      NEW_PATH,
      Buffer.from("pdf-ordre"),
    );
    expect(grantDocumentUpsertMock).toHaveBeenCalledWith({
      where: {
        campaignId_assoId: { campaignId: "campaign-1", assoId: "asso-1" },
      },
      create: {
        campaignId: "campaign-1",
        assoId: "asso-1",
        kind: "ORDRE_DE_FINANCEMENT",
        filePath: NEW_PATH,
        generatedAt: expect.any(Date),
        subventionCount: 2,
      },
      update: {
        kind: "ORDRE_DE_FINANCEMENT",
        filePath: NEW_PATH,
        generatedAt: expect.any(Date),
        subventionCount: 2,
      },
      select: { id: true },
    });
    expect(deleteStoredFileMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/app/admin/subventions/campaign-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/app/club-info/subventions",
    );
  });

  it("génère un Ordre de financement pour une Commission", async () => {
    assoFindUniqueMock.mockResolvedValue(asso("COMMISSION"));

    const result = await generateGrantDocumentAction(
      "campaign-1",
      "asso-1",
      financementFixture,
    );

    expect(result.ok).toBe(true);
    expect(renderOrdreDeFinancementPdfMock).toHaveBeenCalledTimes(1);
  });

  it("génère une Convention pour une Association loi 1901, dates de signature du jour", async () => {
    assoFindUniqueMock.mockResolvedValue(asso("ASSOCIATION_1901"));

    const result = await generateGrantDocumentAction("campaign-1", "asso-1", {
      ...conventionFixture,
      firstPartySignature: {
        ...conventionFixture.firstPartySignature,
        date: "01/01/2000",
      },
    });

    expect(result.ok).toBe(true);
    expect(renderOrdreDeFinancementPdfMock).not.toHaveBeenCalled();
    const rendered = renderConventionPdfMock.mock.calls[0][0];
    expect(rendered.firstPartySignature.date).not.toBe("01/01/2000");
    expect(rendered.firstPartySignature.date).toBe(
      rendered.secondPartySignature.date,
    );
    expect(grantDocumentUpsertMock.mock.calls[0][0].create.kind).toBe(
      "CONVENTION",
    );
  });

  it("recalcule le total depuis les lignes plutôt que de croire celui envoyé", async () => {
    await generateGrantDocumentAction("campaign-1", "asso-1", {
      ...financementFixture,
      expenses: [
        { date: "01/01/2026", description: "A", amount: "100,00 €" },
        { date: "01/01/2026", description: "B", amount: "50,50 €" },
      ],
      total: "999 999,00 €",
    });

    expect(renderOrdreDeFinancementPdfMock.mock.calls[0][0].total).toBe(
      formatCentsForPdf(15050),
    );
  });

  it("recalcule aussi le total d'une Convention", async () => {
    assoFindUniqueMock.mockResolvedValue(asso("ASSOCIATION_1901"));

    await generateGrantDocumentAction("campaign-1", "asso-1", {
      ...conventionFixture,
      totalAmount: "1,00 €",
    });

    expect(renderConventionPdfMock.mock.calls[0][0].totalAmount).toBe(
      formatCentsForPdf(175000),
    );
  });

  it("refuse une ligne dont le montant est illisible", async () => {
    const result = await generateGrantDocumentAction("campaign-1", "asso-1", {
      ...financementFixture,
      expenses: [
        { date: "01/01/2026", description: "A", amount: "cent euros" },
      ],
    });

    expect(result).toEqual({
      ok: false,
      error:
        "Un montant de ligne est illisible : corrigez-le avant de générer le document.",
    });
    expectNothingWritten();
  });

  it("refuse une Convention sans adresse bénéficiaire", async () => {
    assoFindUniqueMock.mockResolvedValue(asso("ASSOCIATION_1901"));

    const result = await generateGrantDocumentAction("campaign-1", "asso-1", {
      ...conventionFixture,
      secondParty: { ...conventionFixture.secondParty, address: "  " },
    });

    expect(result).toEqual({
      ok: false,
      error: "Renseignez l'adresse du siège de l'association bénéficiaire.",
    });
    expectNothingWritten();
  });

  it("refuse des données qui ne correspondent pas au type de document", async () => {
    const result = await generateGrantDocumentAction(
      "campaign-1",
      "asso-1",
      conventionFixture,
    );

    expect(result).toEqual({
      ok: false,
      error: "Les données du document sont invalides.",
    });
    expectNothingWritten();
  });

  it("refuse de générer un document pour une Structure Non classée", async () => {
    assoFindUniqueMock.mockResolvedValue(asso(null));

    const result = await generateGrantDocumentAction(
      "campaign-1",
      "asso-1",
      financementFixture,
    );

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain("Non classée");
    expectNothingWritten();
  });

  it("refuse tant que la Campagne n'est pas publiée", async () => {
    campaignFindUniqueMock.mockResolvedValue(
      campaign({ publicationDate: new Date(Date.now() + 86_400_000) }),
    );

    const result = await generateGrantDocumentAction(
      "campaign-1",
      "asso-1",
      financementFixture,
    );

    expect(result.ok).toBe(false);
    expectNothingWritten();
  });

  it("refuse une Structure sans Subvention dans la Campagne", async () => {
    campaignFindUniqueMock.mockResolvedValue(campaign({ subventions: [] }));

    const result = await generateGrantDocumentAction(
      "campaign-1",
      "asso-1",
      financementFixture,
    );

    expect(result.ok).toBe(false);
    expectNothingWritten();
  });

  it("régénère : met à jour le même enregistrement puis supprime l'ancien fichier", async () => {
    campaignFindUniqueMock.mockResolvedValue(
      campaign({ grantDocuments: [{ id: "doc-1", filePath: OLD_PATH }] }),
    );

    const result = await generateGrantDocumentAction(
      "campaign-1",
      "asso-1",
      financementFixture,
    );

    expect(result).toEqual({ ok: true, documentId: "doc-1" });
    expect(writeStoredFileMock).toHaveBeenCalledWith(
      NEW_PATH,
      expect.any(Buffer),
    );
    expect(grantDocumentUpsertMock).toHaveBeenCalledTimes(1);
    expect(deleteStoredFileMock).toHaveBeenCalledWith(OLD_PATH);
    expect(deleteStoredFileMock).not.toHaveBeenCalledWith(NEW_PATH);
    expect(writeStoredFileMock.mock.invocationCallOrder[0]).toBeLessThan(
      deleteStoredFileMock.mock.invocationCallOrder[0],
    );
  });

  it("n'enregistre rien et garde l'ancien fichier si le rendu échoue", async () => {
    campaignFindUniqueMock.mockResolvedValue(
      campaign({ grantDocuments: [{ id: "doc-1", filePath: OLD_PATH }] }),
    );
    renderOrdreDeFinancementPdfMock.mockRejectedValue(new Error("boom"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await generateGrantDocumentAction(
      "campaign-1",
      "asso-1",
      financementFixture,
    );

    expect(result).toEqual({
      ok: false,
      error: "La génération du document a échoué.",
    });
    expect(grantDocumentUpsertMock).not.toHaveBeenCalled();
    expect(deleteStoredFileMock).not.toHaveBeenCalledWith(OLD_PATH);
  });

  it("n'enregistre rien si l'écriture du fichier échoue", async () => {
    writeStoredFileMock.mockRejectedValue(new Error("disk full"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await generateGrantDocumentAction(
      "campaign-1",
      "asso-1",
      financementFixture,
    );

    expect(result.ok).toBe(false);
    expect(grantDocumentUpsertMock).not.toHaveBeenCalled();
  });

  it("supprime le nouveau fichier si l'enregistrement échoue", async () => {
    campaignFindUniqueMock.mockResolvedValue(
      campaign({ grantDocuments: [{ id: "doc-1", filePath: OLD_PATH }] }),
    );
    grantDocumentUpsertMock.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await generateGrantDocumentAction(
      "campaign-1",
      "asso-1",
      financementFixture,
    );

    expect(result.ok).toBe(false);
    expect(deleteStoredFileMock).toHaveBeenCalledWith(NEW_PATH);
    expect(deleteStoredFileMock).not.toHaveBeenCalledWith(OLD_PATH);
  });

  it("refuse un non-admin", async () => {
    requireAdminMock.mockRejectedValue(new Error("NEXT_NOT_FOUND"));

    await expect(
      generateGrantDocumentAction("campaign-1", "asso-1", financementFixture),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(campaignFindUniqueMock).not.toHaveBeenCalled();
    expectNothingWritten();
  });
});
