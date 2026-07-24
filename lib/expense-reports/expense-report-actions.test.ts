import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireStructureAccessMock,
  reportCreateMock,
  reportFindUniqueMock,
  reportUpdateMock,
  lineCreateMock,
  lineFindUniqueMock,
  lineUpdateMock,
  assoFindUniqueMock,
  subventionFindUniqueMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  requireStructureAccessMock: vi.fn(),
  reportCreateMock: vi.fn(),
  reportFindUniqueMock: vi.fn(),
  reportUpdateMock: vi.fn(),
  lineCreateMock: vi.fn(),
  lineFindUniqueMock: vi.fn(),
  lineUpdateMock: vi.fn(),
  assoFindUniqueMock: vi.fn(),
  subventionFindUniqueMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireStructureAccess: requireStructureAccessMock,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseReport: {
      create: reportCreateMock,
      findUnique: reportFindUniqueMock,
      update: reportUpdateMock,
    },
    expenseReportLine: {
      create: lineCreateMock,
      findUnique: lineFindUniqueMock,
      update: lineUpdateMock,
    },
    asso: { findUnique: assoFindUniqueMock },
    subvention: { findUnique: subventionFindUniqueMock },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const {
  createExpenseReportAction,
  updateExpenseReportAction,
  addExpenseReportLineAction,
  updateExpenseReportLineAction,
} = await import("./expense-report-actions");

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

const structureAccess = {
  structure: { assoId: "asso-1", slug: "club-info", name: "Club Info" },
  user: { id: "user-1" },
};

beforeEach(() => {
  requireStructureAccessMock.mockReset();
  reportCreateMock.mockReset();
  reportFindUniqueMock.mockReset();
  reportUpdateMock.mockReset();
  lineCreateMock.mockReset();
  lineFindUniqueMock.mockReset();
  lineUpdateMock.mockReset();
  assoFindUniqueMock.mockReset();
  subventionFindUniqueMock.mockReset();
  revalidatePathMock.mockReset();
  requireStructureAccessMock.mockResolvedValue(structureAccess);
});

describe("createExpenseReportAction", () => {
  const valid = {
    assoSlug: "club-info",
    title: "Gala 2026",
    description: "Déplacement en car",
  };

  it("refuse un titre vide sans appeler requireStructureAccess", async () => {
    const result = await createExpenseReportAction(
      { ok: false },
      formData({ ...valid, title: "   " }),
    );

    expect(result.ok).toBe(false);
    expect(requireStructureAccessMock).not.toHaveBeenCalled();
    expect(reportCreateMock).not.toHaveBeenCalled();
  });

  it("crée la Note en Brouillon pour la Structure de l'utilisateur et revalide la liste", async () => {
    reportCreateMock.mockResolvedValue({ id: "report-1" });

    const result = await createExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(reportCreateMock).toHaveBeenCalledWith({
      data: {
        assoId: "asso-1",
        createdBy: "user-1",
        title: valid.title,
        description: valid.description,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/app/club-info/notes-de-frais",
    );
    expect(result).toEqual({ ok: true, reportId: "report-1" });
  });
});

describe("updateExpenseReportAction", () => {
  const valid = {
    id: "11111111-1111-1111-8111-111111111111",
    assoSlug: "club-info",
    title: "Gala 2026 (corrigé)",
    description: "",
  };

  it("refuse une Note introuvable ou d'une autre Structure", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-autre",
      status: "DRAFT",
    });

    const result = await updateExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({ ok: false, error: "Note de frais introuvable." });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note n'est plus en Brouillon", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-1",
      status: "SUBMITTED",
    });

    const result = await updateExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est plus modifiable.",
    });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("met à jour le titre et la description, et revalide la page détail", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      assoId: "asso-1",
      status: "DRAFT",
    });

    const result = await updateExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(reportUpdateMock).toHaveBeenCalledWith({
      where: { id: valid.id },
      data: { title: valid.title, description: null },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/club-info/notes-de-frais/${valid.id}`,
    );
    expect(result).toEqual({ ok: true });
  });
});

const validLine = {
  expenseReportId: "22222222-2222-2222-8222-222222222222",
  assoSlug: "club-info",
  beneficiaryFirstname: "Jean",
  beneficiaryLastname: "Dupont",
  iban: "FR7630006000011234567890189",
  amount: "42.50",
  typeDepenseId: "33333333-3333-3333-8333-333333333333",
  customLabel: "",
  fundingSource: "CLUB_BALANCE",
  subventionId: "",
};

const draftReport = {
  id: validLine.expenseReportId,
  assoId: "asso-1",
  status: "DRAFT",
};

describe("addExpenseReportLineAction", () => {
  it("refuse une saisie invalide et renvoie les valeurs brutes pour réaffichage", async () => {
    const result = await addExpenseReportLineAction(
      { ok: false },
      formData({ ...validLine, amount: "-5" }),
    );

    expect(result.ok).toBe(false);
    expect(result.values?.beneficiaryFirstname).toBe("Jean");
    expect(requireStructureAccessMock).not.toHaveBeenCalled();
    expect(lineCreateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note n'existe pas ou appartient à une autre Structure", async () => {
    reportFindUniqueMock.mockResolvedValue({
      ...draftReport,
      assoId: "asso-autre",
    });

    const result = await addExpenseReportLineAction(
      { ok: false },
      formData(validLine),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Note de frais introuvable.");
    expect(lineCreateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note n'est plus en Brouillon", async () => {
    reportFindUniqueMock.mockResolvedValue({
      ...draftReport,
      status: "TAKEN_OVER",
    });

    const result = await addExpenseReportLineAction(
      { ok: false },
      formData(validLine),
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Cette Note de frais n'est plus modifiable.",
      }),
    );
    expect(lineCreateMock).not.toHaveBeenCalled();
  });

  it("refuse le Solde comme source pour une Structure qui n'est pas un Club", async () => {
    reportFindUniqueMock.mockResolvedValue(draftReport);
    assoFindUniqueMock.mockResolvedValue({ type: "COMMISSION" });

    const result = await addExpenseReportLineAction(
      { ok: false },
      formData(validLine),
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Seuls les Clubs peuvent utiliser le Solde.",
      }),
    );
    expect(lineCreateMock).not.toHaveBeenCalled();
  });

  it("crée la Ligne financée par le Solde pour un Club, montant converti en centimes", async () => {
    reportFindUniqueMock.mockResolvedValue(draftReport);
    assoFindUniqueMock.mockResolvedValue({ type: "CLUB" });

    const result = await addExpenseReportLineAction(
      { ok: false },
      formData(validLine),
    );

    expect(lineCreateMock).toHaveBeenCalledWith({
      data: {
        expenseReportId: validLine.expenseReportId,
        beneficiaryFirstname: "Jean",
        beneficiaryLastname: "Dupont",
        iban: "FR7630006000011234567890189",
        amountCents: 4250,
        typeDepenseId: validLine.typeDepenseId,
        customLabel: null,
        fundingSource: "CLUB_BALANCE",
        subventionId: null,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/club-info/notes-de-frais/${validLine.expenseReportId}`,
    );
    expect(result).toEqual({ ok: true });
  });

  it("refuse une Subvention introuvable, d'une autre Structure, ou dont la campagne n'est pas publiée", async () => {
    reportFindUniqueMock.mockResolvedValue(draftReport);
    subventionFindUniqueMock.mockResolvedValue(null);

    const subventionLine = {
      ...validLine,
      typeDepenseId: "",
      customLabel: "Location de matériel",
      fundingSource: "SUBVENTION",
      subventionId: "44444444-4444-4444-8444-444444444444",
    };

    const result = await addExpenseReportLineAction(
      { ok: false },
      formData(subventionLine),
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Subvention introuvable ou non publiée.",
      }),
    );
    expect(lineCreateMock).not.toHaveBeenCalled();
  });

  it("crée la Ligne financée par une Subvention Publiée de la même Structure", async () => {
    reportFindUniqueMock.mockResolvedValue(draftReport);
    subventionFindUniqueMock.mockResolvedValue({
      assoId: "asso-1",
      campaign: { publicationDate: new Date("2020-01-01") },
    });

    const subventionLine = {
      ...validLine,
      typeDepenseId: "",
      customLabel: "Location de matériel",
      fundingSource: "SUBVENTION",
      subventionId: "44444444-4444-4444-8444-444444444444",
    };

    const result = await addExpenseReportLineAction(
      { ok: false },
      formData(subventionLine),
    );

    expect(lineCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fundingSource: "SUBVENTION",
        subventionId: "44444444-4444-4444-8444-444444444444",
        customLabel: "Location de matériel",
        typeDepenseId: null,
      }),
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("updateExpenseReportLineAction", () => {
  const validUpdate = {
    ...validLine,
    id: "55555555-5555-5555-8555-555555555555",
  };

  const draftLine = {
    id: validUpdate.id,
    expenseReportId: validLine.expenseReportId,
    expenseReport: { assoId: "asso-1", status: "DRAFT" },
  };

  it("refuse une Ligne introuvable ou d'une autre Structure", async () => {
    lineFindUniqueMock.mockResolvedValue({
      ...draftLine,
      expenseReport: { assoId: "asso-autre", status: "DRAFT" },
    });

    const result = await updateExpenseReportLineAction(
      { ok: false },
      formData(validUpdate),
    );

    expect(result).toEqual(
      expect.objectContaining({ ok: false, error: "Ligne introuvable." }),
    );
    expect(lineUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note n'est plus en Brouillon", async () => {
    lineFindUniqueMock.mockResolvedValue({
      ...draftLine,
      expenseReport: { assoId: "asso-1", status: "FINALIZED" },
    });

    const result = await updateExpenseReportLineAction(
      { ok: false },
      formData(validUpdate),
    );

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        error: "Cette Note de frais n'est plus modifiable.",
      }),
    );
    expect(lineUpdateMock).not.toHaveBeenCalled();
  });

  it("met à jour la Ligne et revalide la page détail", async () => {
    lineFindUniqueMock.mockResolvedValue(draftLine);
    assoFindUniqueMock.mockResolvedValue({ type: "CLUB" });

    const result = await updateExpenseReportLineAction(
      { ok: false },
      formData(validUpdate),
    );

    expect(lineUpdateMock).toHaveBeenCalledWith({
      where: { id: validUpdate.id },
      data: expect.objectContaining({
        beneficiaryFirstname: "Jean",
        amountCents: 4250,
        fundingSource: "CLUB_BALANCE",
      }),
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/club-info/notes-de-frais/${validLine.expenseReportId}`,
    );
    expect(result).toEqual({ ok: true });
  });
});
