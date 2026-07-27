import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  requireAdminMock,
  reportFindUniqueMock,
  reportUpdateMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  reportFindUniqueMock: vi.fn(),
  reportUpdateMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseReport: {
      findUnique: reportFindUniqueMock,
      update: reportUpdateMock,
    },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

const { takeOverExpenseReportAction } = await import(
  "./expense-report-actions"
);

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

const admin = { id: "admin-1", isAdmin: true };

beforeEach(() => {
  requireAdminMock.mockReset();
  reportFindUniqueMock.mockReset();
  reportUpdateMock.mockReset();
  revalidatePathMock.mockReset();
  requireAdminMock.mockResolvedValue(admin);
});

describe("takeOverExpenseReportAction", () => {
  const valid = { id: "11111111-1111-1111-8111-111111111111" };

  it("refuse une Note introuvable", async () => {
    reportFindUniqueMock.mockResolvedValue(null);

    const result = await takeOverExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({ ok: false, error: "Note de frais introuvable." });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note n'est pas Soumise (Brouillon)", async () => {
    reportFindUniqueMock.mockResolvedValue({ id: valid.id, status: "DRAFT" });

    const result = await takeOverExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est pas en attente de prise en charge.",
    });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("refuse si la Note est déjà Prise en charge (pas de double verrouillage)", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      status: "TAKEN_OVER",
    });

    const result = await takeOverExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(result).toEqual({
      ok: false,
      error: "Cette Note de frais n'est pas en attente de prise en charge.",
    });
    expect(reportUpdateMock).not.toHaveBeenCalled();
  });

  it("passe la Note de Soumise à Prise en charge et enregistre l'Admin", async () => {
    reportFindUniqueMock.mockResolvedValue({
      id: valid.id,
      status: "SUBMITTED",
    });

    const result = await takeOverExpenseReportAction(
      { ok: false },
      formData(valid),
    );

    expect(reportUpdateMock).toHaveBeenCalledWith({
      where: { id: valid.id },
      data: {
        status: "TAKEN_OVER",
        takenByAdminId: admin.id,
        takenAt: expect.any(Date),
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/admin/notes-de-frais/${valid.id}`,
    );
    expect(result).toEqual({ ok: true });
  });
});
