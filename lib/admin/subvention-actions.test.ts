import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireAdminMock,
  campaignFindUniqueMock,
  subventionCreateMock,
  subventionUpdateMock,
  subventionFindUniqueMock,
  subventionDeleteMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  campaignFindUniqueMock: vi.fn(),
  subventionCreateMock: vi.fn(),
  subventionUpdateMock: vi.fn(),
  subventionFindUniqueMock: vi.fn(),
  subventionDeleteMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    subventionCampaign: { findUnique: campaignFindUniqueMock },
    subvention: {
      create: subventionCreateMock,
      update: subventionUpdateMock,
      findUnique: subventionFindUniqueMock,
      delete: subventionDeleteMock,
    },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const { addSubventionAction, updateSubventionAction, deleteSubventionAction } =
  await import("./subvention-actions");

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
  campaignId: "11111111-1111-1111-8111-111111111111",
  assoId: "22222222-2222-2222-8222-222222222222",
  reason: "Achat de matériel sportif",
  amount: "350.50",
  commentary: "Sur présentation de facture",
};

beforeEach(() => {
  requireAdminMock.mockReset();
  campaignFindUniqueMock.mockReset();
  subventionCreateMock.mockReset();
  subventionUpdateMock.mockReset();
  subventionFindUniqueMock.mockReset();
  subventionDeleteMock.mockReset();
  revalidatePathMock.mockReset();
  requireAdminMock.mockResolvedValue(admin);
  campaignFindUniqueMock.mockResolvedValue({ id: valid.campaignId });
  subventionCreateMock.mockImplementation(async ({ data }) => ({
    id: "sub-1",
    ...data,
  }));
});

describe("addSubventionAction", () => {
  it("exige un Admin", async () => {
    await addSubventionAction({ ok: false }, formData(valid));

    expect(requireAdminMock).toHaveBeenCalled();
  });

  it("refuse une saisie invalide sans toucher à la base", async () => {
    const result = await addSubventionAction(
      { ok: false },
      formData({ ...valid, amount: "-5" }),
    );

    expect(result.ok).toBe(false);
    expect(campaignFindUniqueMock).not.toHaveBeenCalled();
    expect(subventionCreateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Campagne n'existe pas", async () => {
    campaignFindUniqueMock.mockResolvedValue(null);

    const result = await addSubventionAction({ ok: false }, formData(valid));

    expect(result).toEqual({ ok: false, error: "Campagne introuvable." });
    expect(subventionCreateMock).not.toHaveBeenCalled();
  });

  it("crée la Subvention avec le montant converti en centimes", async () => {
    const result = await addSubventionAction({ ok: false }, formData(valid));

    expect(subventionCreateMock).toHaveBeenCalledWith({
      data: {
        campaignId: valid.campaignId,
        assoId: valid.assoId,
        reason: valid.reason,
        amountCents: 35050,
        commentary: valid.commentary,
      },
    });
    expect(result).toEqual({ ok: true });
  });

  it("revalide la liste des Campagnes et la page de détail (totaux, Documents d'octroi à régénérer)", async () => {
    await addSubventionAction({ ok: false }, formData(valid));

    expect(revalidatePathMock).toHaveBeenCalledWith("/app/admin/subventions");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/subventions/${valid.campaignId}`,
    );
  });

  it("permet plusieurs Subventions pour la même Structure dans la même Campagne", async () => {
    subventionCreateMock
      .mockImplementationOnce(async ({ data }) => ({ id: "sub-1", ...data }))
      .mockImplementationOnce(async ({ data }) => ({ id: "sub-2", ...data }));

    const first = await addSubventionAction({ ok: false }, formData(valid));
    const second = await addSubventionAction({ ok: false }, formData(valid));

    expect(subventionCreateMock).toHaveBeenCalledTimes(2);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
  });
});

describe("updateSubventionAction", () => {
  const validUpdate = {
    id: "33333333-3333-3333-8333-333333333333",
    campaignId: valid.campaignId,
    reason: "Achat de matériel sportif corrigé",
    amount: "400",
    commentary: "",
  };

  it("exige un Admin", async () => {
    await updateSubventionAction({ ok: false }, formData(validUpdate));

    expect(requireAdminMock).toHaveBeenCalled();
  });

  it("refuse une saisie invalide sans toucher à la base", async () => {
    const result = await updateSubventionAction(
      { ok: false },
      formData({ ...validUpdate, amount: "-5" }),
    );

    expect(result.ok).toBe(false);
    expect(subventionUpdateMock).not.toHaveBeenCalled();
  });

  it("met à jour la raison, le montant et le commentaire, et revalide les pages", async () => {
    const result = await updateSubventionAction(
      { ok: false },
      formData(validUpdate),
    );

    expect(subventionUpdateMock).toHaveBeenCalledWith({
      where: { id: validUpdate.id },
      data: {
        reason: validUpdate.reason,
        amountCents: 40000,
        commentary: null,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/subventions/${valid.campaignId}`,
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/admin/subventions");
    expect(result).toEqual({ ok: true });
  });
});

describe("deleteSubventionAction", () => {
  const validDelete = {
    id: "33333333-3333-3333-8333-333333333333",
    campaignId: valid.campaignId,
  };

  it("exige un Admin", async () => {
    subventionFindUniqueMock.mockResolvedValue({
      _count: { expenseReportLines: 0, financialMovements: 0 },
    });

    await deleteSubventionAction({ ok: false }, formData(validDelete));

    expect(requireAdminMock).toHaveBeenCalled();
  });

  it("refuse une saisie invalide sans toucher à la base", async () => {
    const result = await deleteSubventionAction(
      { ok: false },
      formData({ id: "not-a-uuid", campaignId: valid.campaignId }),
    );

    expect(result.ok).toBe(false);
    expect(subventionFindUniqueMock).not.toHaveBeenCalled();
    expect(subventionDeleteMock).not.toHaveBeenCalled();
  });

  it("refuse si la Subvention n'existe pas", async () => {
    subventionFindUniqueMock.mockResolvedValue(null);

    const result = await deleteSubventionAction(
      { ok: false },
      formData(validDelete),
    );

    expect(result).toEqual({ ok: false, error: "Subvention introuvable." });
    expect(subventionDeleteMock).not.toHaveBeenCalled();
  });

  it("refuse si la Subvention est déjà utilisée par une ligne de Note de frais", async () => {
    subventionFindUniqueMock.mockResolvedValue({
      _count: { expenseReportLines: 1, financialMovements: 0 },
    });

    const result = await deleteSubventionAction(
      { ok: false },
      formData(validDelete),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Subvention est déjà utilisée, impossible de la supprimer.",
    });
    expect(subventionDeleteMock).not.toHaveBeenCalled();
  });

  it("refuse si la Subvention est déjà utilisée par un Mouvement financier", async () => {
    subventionFindUniqueMock.mockResolvedValue({
      _count: { expenseReportLines: 0, financialMovements: 1 },
    });

    const result = await deleteSubventionAction(
      { ok: false },
      formData(validDelete),
    );

    expect(result.ok).toBe(false);
    expect(subventionDeleteMock).not.toHaveBeenCalled();
  });

  it("supprime la Subvention inutilisée et revalide les pages", async () => {
    subventionFindUniqueMock.mockResolvedValue({
      _count: { expenseReportLines: 0, financialMovements: 0 },
    });

    const result = await deleteSubventionAction(
      { ok: false },
      formData(validDelete),
    );

    expect(subventionDeleteMock).toHaveBeenCalledWith({
      where: { id: validDelete.id },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/subventions/${valid.campaignId}`,
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/admin/subventions");
    expect(result).toEqual({ ok: true });
  });
});
