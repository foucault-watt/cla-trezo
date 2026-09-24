import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireAdminMock,
  createMock,
  updateMock,
  campaignFindUniqueMock,
  campaignDeleteMock,
  subventionCountMock,
  subventionDeleteManyMock,
  grantDocumentDeleteManyMock,
  deleteStoredFileMock,
  transactionMock,
  revalidatePathMock,
  redirectMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  campaignFindUniqueMock: vi.fn(),
  campaignDeleteMock: vi.fn(),
  subventionCountMock: vi.fn(),
  subventionDeleteManyMock: vi.fn(),
  grantDocumentDeleteManyMock: vi.fn(),
  deleteStoredFileMock: vi.fn(),
  transactionMock: vi.fn((operations: unknown[]) => Promise.all(operations)),
  revalidatePathMock: vi.fn(),
  redirectMock: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    subventionCampaign: {
      create: createMock,
      update: updateMock,
      findUnique: campaignFindUniqueMock,
      delete: campaignDeleteMock,
    },
    subvention: {
      count: subventionCountMock,
      deleteMany: subventionDeleteManyMock,
    },
    grantDocument: { deleteMany: grantDocumentDeleteManyMock },
    $transaction: transactionMock,
  },
}));
vi.mock("@/lib/storage/file-storage", () => ({
  deleteStoredFile: deleteStoredFileMock,
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

const {
  createSubventionCampaignAction,
  updateSubventionCampaignAction,
  deleteSubventionCampaignAction,
} = await import("./subvention-campaign-actions");

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
  type: "CA_BUDGET",
  name: "Campagne CA Budget 2026",
  date: "2026-09-01",
  publicationDate: "2026-09-15",
};

beforeEach(() => {
  requireAdminMock.mockReset();
  createMock.mockReset();
  updateMock.mockReset();
  campaignFindUniqueMock.mockReset();
  campaignDeleteMock.mockReset();
  subventionCountMock.mockReset();
  subventionDeleteManyMock.mockReset();
  grantDocumentDeleteManyMock.mockReset();
  deleteStoredFileMock.mockReset().mockResolvedValue(undefined);
  transactionMock.mockClear();
  revalidatePathMock.mockReset();
  redirectMock.mockClear();
  requireAdminMock.mockResolvedValue(admin);
  createMock.mockResolvedValue({ id: "11111111-1111-1111-8111-111111111111" });
  updateMock.mockResolvedValue({ id: "11111111-1111-1111-8111-111111111111" });
  campaignFindUniqueMock.mockResolvedValue({
    id: "11111111-1111-1111-8111-111111111111",
    grantDocuments: [],
  });
  subventionCountMock.mockResolvedValue(0);
});

describe("createSubventionCampaignAction", () => {
  it("exige un Admin", async () => {
    await createSubventionCampaignAction({ ok: false }, formData(valid));

    expect(requireAdminMock).toHaveBeenCalled();
  });

  it("refuse une saisie invalide sans toucher à la base", async () => {
    const result = await createSubventionCampaignAction(
      { ok: false },
      formData({ ...valid, name: "" }),
    );

    expect(result.ok).toBe(false);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("crée la Campagne et revalide la liste", async () => {
    const result = await createSubventionCampaignAction(
      { ok: false },
      formData(valid),
    );

    expect(createMock).toHaveBeenCalledWith({
      data: {
        type: "CA_BUDGET",
        name: valid.name,
        date: new Date(valid.date),
        publicationDate: new Date(valid.publicationDate),
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/admin/subventions");
    expect(result).toEqual({
      ok: true,
      campaignId: "11111111-1111-1111-8111-111111111111",
    });
  });

  it("crée la Campagne sans date de publication (reste Programmée)", async () => {
    await createSubventionCampaignAction(
      { ok: false },
      formData({ ...valid, publicationDate: "" }),
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ publicationDate: null }),
      }),
    );
  });
});

describe("updateSubventionCampaignAction", () => {
  const validUpdate = {
    ...valid,
    campaignId: "11111111-1111-1111-8111-111111111111",
  };

  it("exige un Admin", async () => {
    await updateSubventionCampaignAction({ ok: false }, formData(validUpdate));

    expect(requireAdminMock).toHaveBeenCalled();
  });

  it("refuse une saisie invalide sans toucher à la base", async () => {
    const result = await updateSubventionCampaignAction(
      { ok: false },
      formData({ ...validUpdate, name: "" }),
    );

    expect(result.ok).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("met à jour la Campagne, y compris sa date de publication, et revalide les pages", async () => {
    const result = await updateSubventionCampaignAction(
      { ok: false },
      formData(validUpdate),
    );

    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "11111111-1111-1111-8111-111111111111" },
      data: {
        type: "CA_BUDGET",
        name: valid.name,
        date: new Date(valid.date),
        publicationDate: new Date(valid.publicationDate),
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/subventions/${validUpdate.campaignId}`,
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/admin/subventions");
    expect(result).toEqual({ ok: true });
  });

  it("peut faire passer une Campagne de Programmée à Publiée en renseignant la date", async () => {
    await updateSubventionCampaignAction(
      { ok: false },
      formData({ ...validUpdate, publicationDate: "2020-01-01" }),
    );

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          publicationDate: new Date("2020-01-01"),
        }),
      }),
    );
  });
});

describe("deleteSubventionCampaignAction", () => {
  const campaignId = "11111111-1111-1111-8111-111111111111";

  it("exige un Admin", async () => {
    await expect(
      deleteSubventionCampaignAction(
        { ok: false },
        formData({ id: campaignId }),
      ),
    ).rejects.toThrow("REDIRECT");

    expect(requireAdminMock).toHaveBeenCalled();
  });

  it("refuse une saisie invalide sans toucher à la base", async () => {
    const result = await deleteSubventionCampaignAction(
      { ok: false },
      formData({ id: "not-a-uuid" }),
    );

    expect(result.ok).toBe(false);
    expect(campaignFindUniqueMock).not.toHaveBeenCalled();
  });

  it("refuse si la Campagne n'existe pas", async () => {
    campaignFindUniqueMock.mockResolvedValue(null);

    const result = await deleteSubventionCampaignAction(
      { ok: false },
      formData({ id: campaignId }),
    );

    expect(result).toEqual({ ok: false, error: "Campagne introuvable." });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("refuse si une Subvention de la Campagne est déjà utilisée", async () => {
    subventionCountMock.mockResolvedValue(1);

    const result = await deleteSubventionCampaignAction(
      { ok: false },
      formData({ id: campaignId }),
    );

    expect(result).toEqual({
      ok: false,
      error:
        "Cette Campagne contient des Subventions déjà utilisées, impossible de la supprimer.",
    });
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it("supprime la Campagne et ses Subventions puis redirige avec un toast", async () => {
    await expect(
      deleteSubventionCampaignAction(
        { ok: false },
        formData({ id: campaignId }),
      ),
    ).rejects.toThrow("REDIRECT");

    expect(transactionMock).toHaveBeenCalled();
    expect(subventionDeleteManyMock).toHaveBeenCalledWith({
      where: { campaignId },
    });
    expect(campaignDeleteMock).toHaveBeenCalledWith({
      where: { id: campaignId },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/admin/subventions");
    expect(redirectMock).toHaveBeenCalledWith(
      expect.stringContaining("/app/admin/subventions?toast="),
    );
  });

  it("supprime aussi les Documents d'octroi de la Campagne et leurs fichiers", async () => {
    campaignFindUniqueMock.mockResolvedValue({
      id: campaignId,
      grantDocuments: [{ filePath: "club-info/2026/octroi/c/doc.pdf" }],
    });

    await expect(
      deleteSubventionCampaignAction(
        { ok: false },
        formData({ id: campaignId }),
      ),
    ).rejects.toThrow("REDIRECT");

    expect(grantDocumentDeleteManyMock).toHaveBeenCalledWith({
      where: { campaignId },
    });
    expect(deleteStoredFileMock).toHaveBeenCalledWith(
      "club-info/2026/octroi/c/doc.pdf",
    );
  });

  it("garde les fichiers si la Campagne ne peut pas être supprimée", async () => {
    subventionCountMock.mockResolvedValue(1);
    campaignFindUniqueMock.mockResolvedValue({
      id: campaignId,
      grantDocuments: [{ filePath: "club-info/2026/octroi/c/doc.pdf" }],
    });

    await deleteSubventionCampaignAction(
      { ok: false },
      formData({ id: campaignId }),
    );

    expect(deleteStoredFileMock).not.toHaveBeenCalled();
  });
});
