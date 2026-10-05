import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminMock,
  typeFindManyMock,
  typeFindUniqueMock,
  typeCreateMock,
  typeUpdateMock,
  typeDeleteMock,
  lineUpdateManyMock,
  transactionMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  typeFindManyMock: vi.fn(),
  typeFindUniqueMock: vi.fn(),
  typeCreateMock: vi.fn(),
  typeUpdateMock: vi.fn(),
  typeDeleteMock: vi.fn(),
  lineUpdateManyMock: vi.fn(),
  transactionMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    typeDepense: {
      findMany: typeFindManyMock,
      findUnique: typeFindUniqueMock,
      create: typeCreateMock,
      update: typeUpdateMock,
      delete: typeDeleteMock,
    },
    expenseReportLine: { updateMany: lineUpdateManyMock },
    $transaction: transactionMock,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const {
  createTypeDepenseAction,
  updateTypeDepenseAction,
  deleteTypeDepenseAction,
  reclassCustomLabelAction,
} = await import("./type-depense-actions");

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

const MATERIEL = "11111111-1111-1111-8111-111111111111";
const TRANSPORT = "22222222-2222-2222-8222-222222222222";
const types = [
  { id: MATERIEL, label: "Matériel" },
  { id: TRANSPORT, label: "Transport" },
];

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ id: "admin-1", isAdmin: true });
  typeFindManyMock.mockResolvedValue(types);
  typeFindUniqueMock.mockImplementation(async ({ where }) => {
    const type = types.find((t) => t.id === where.id);
    return type ? { ...type, _count: { expenseReportLines: 0 } } : null;
  });
  lineUpdateManyMock.mockImplementation(async (args) => ({ count: 2, args }));
  typeDeleteMock.mockImplementation(async (args) => args);
  transactionMock.mockImplementation(async (operations) =>
    Promise.all(operations),
  );
});

describe("createTypeDepenseAction", () => {
  it("exige un Admin", async () => {
    await createTypeDepenseAction({ ok: false }, formData({ label: "Sport" }));

    expect(requireAdminMock).toHaveBeenCalled();
  });

  it("crée le Type avec un libellé nettoyé", async () => {
    const result = await createTypeDepenseAction(
      { ok: false },
      formData({ label: "  Frais   de port " }),
    );

    expect(typeCreateMock).toHaveBeenCalledWith({
      data: { label: "Frais de port" },
    });
    expect(result.ok).toBe(true);
  });

  it("refuse un Type équivalent à un Type existant", async () => {
    const result = await createTypeDepenseAction(
      { ok: false },
      formData({ label: "materiel" }),
    );

    expect(result).toEqual({
      ok: false,
      error: "Le Type de dépense « Matériel » existe déjà.",
    });
    expect(typeCreateMock).not.toHaveBeenCalled();
  });
});

describe("updateTypeDepenseAction", () => {
  it("autorise à changer la casse du Type lui-même", async () => {
    const result = await updateTypeDepenseAction(
      { ok: false },
      formData({ id: MATERIEL, label: "MATÉRIEL" }),
    );

    expect(result.ok).toBe(true);
    expect(typeUpdateMock).toHaveBeenCalledWith({
      where: { id: MATERIEL },
      data: { label: "MATÉRIEL" },
    });
  });

  it("refuse le nom d'un autre Type", async () => {
    const result = await updateTypeDepenseAction(
      { ok: false },
      formData({ id: MATERIEL, label: "transport" }),
    );

    expect(result.ok).toBe(false);
    expect(typeUpdateMock).not.toHaveBeenCalled();
  });
});

describe("deleteTypeDepenseAction", () => {
  function usedBy(count: number) {
    typeFindUniqueMock.mockImplementation(async ({ where }) => {
      const type = types.find((t) => t.id === where.id);
      if (!type) return null;
      return {
        ...type,
        _count: { expenseReportLines: where.id === MATERIEL ? count : 0 },
      };
    });
  }

  it("supprime directement un Type inutilisé", async () => {
    const result = await deleteTypeDepenseAction(
      { ok: false },
      formData({ id: MATERIEL }),
    );

    expect(result.ok).toBe(true);
    expect(typeDeleteMock).toHaveBeenCalledWith({ where: { id: MATERIEL } });
    expect(lineUpdateManyMock).not.toHaveBeenCalled();
  });

  it("exige un remplacement pour un Type utilisé", async () => {
    usedBy(3);

    const result = await deleteTypeDepenseAction(
      { ok: false },
      formData({ id: MATERIEL }),
    );

    expect(result.ok).toBe(false);
    expect(typeDeleteMock).not.toHaveBeenCalled();
  });

  it("refuse de se remplacer par lui-même", async () => {
    usedBy(3);

    const result = await deleteTypeDepenseAction(
      { ok: false },
      formData({ id: MATERIEL, replacementTypeDepenseId: MATERIEL }),
    );

    expect(result.ok).toBe(false);
    expect(typeDeleteMock).not.toHaveBeenCalled();
  });

  it("rattache les Remboursements au remplaçant puis supprime, en une transaction", async () => {
    usedBy(2);

    const result = await deleteTypeDepenseAction(
      { ok: false },
      formData({ id: MATERIEL, replacementTypeDepenseId: TRANSPORT }),
    );

    expect(result.ok).toBe(true);
    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(lineUpdateManyMock).toHaveBeenCalledWith({
      where: { typeDepenseId: MATERIEL },
      data: { typeDepenseId: TRANSPORT },
    });
    expect(typeDeleteMock).toHaveBeenCalledWith({ where: { id: MATERIEL } });
  });
});

describe("reclassCustomLabelAction", () => {
  it("renomme un libellé personnalisé qui reste personnalisé", async () => {
    const result = await reclassCustomLabelAction(
      { ok: false },
      formData({ mode: "RENAME", customLabel: "spor", newLabel: "Sport" }),
    );

    expect(result.ok).toBe(true);
    expect(lineUpdateManyMock).toHaveBeenCalledWith({
      where: { customLabel: "spor", typeDepenseId: null },
      data: { customLabel: "Sport" },
    });
  });

  it("rattache au Type existant quand le nouveau nom lui équivaut", async () => {
    const result = await reclassCustomLabelAction(
      { ok: false },
      formData({ mode: "RENAME", customLabel: "matos", newLabel: "materiel" }),
    );

    expect(result.ok).toBe(true);
    expect(lineUpdateManyMock).toHaveBeenCalledWith({
      where: { customLabel: "matos", typeDepenseId: null },
      data: { typeDepenseId: MATERIEL, customLabel: null },
    });
  });

  it("impose un Type existant et efface le libellé personnalisé", async () => {
    const result = await reclassCustomLabelAction(
      { ok: false },
      formData({ mode: "TYPE", customLabel: "Bus", typeDepenseId: TRANSPORT }),
    );

    expect(result.ok).toBe(true);
    expect(lineUpdateManyMock).toHaveBeenCalledWith({
      where: { customLabel: "Bus", typeDepenseId: null },
      data: { typeDepenseId: TRANSPORT, customLabel: null },
    });
  });

  it("refuse un Type imposé introuvable", async () => {
    const result = await reclassCustomLabelAction(
      { ok: false },
      formData({
        mode: "TYPE",
        customLabel: "Bus",
        typeDepenseId: "33333333-3333-3333-8333-333333333333",
      }),
    );

    expect(result).toEqual({ ok: false, error: "Type de dépense introuvable." });
    expect(lineUpdateManyMock).not.toHaveBeenCalled();
  });

  it("refuse un renommage identique", async () => {
    const result = await reclassCustomLabelAction(
      { ok: false },
      formData({ mode: "RENAME", customLabel: "Sport", newLabel: "Sport" }),
    );

    expect(result.ok).toBe(false);
    expect(lineUpdateManyMock).not.toHaveBeenCalled();
  });

  it("signale un libellé qui n'est plus utilisé", async () => {
    lineUpdateManyMock.mockResolvedValue({ count: 0 });

    const result = await reclassCustomLabelAction(
      { ok: false },
      formData({ mode: "TYPE", customLabel: "Bus", typeDepenseId: TRANSPORT }),
    );

    expect(result.ok).toBe(false);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
