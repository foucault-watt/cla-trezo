"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import {
  assertExpenseReportTransition,
  ExpenseReportLifecycleError,
} from "@/lib/expense-reports/expense-report-lifecycle";
import { prisma } from "@/lib/prisma";
import { parseTakeOverExpenseReportForm } from "./expense-report-input";

export type TakeOverExpenseReportState = { ok: boolean; error?: string };

/**
 * Première action de l'Admin sur une Note de frais Soumise : la note passe
 * à Prise en charge et la Structure perd définitivement la main dessus
 * (cf. ADR-0001, verrouillage à sens unique, pas de retour en arrière).
 */
export async function takeOverExpenseReportAction(
  _prevState: TakeOverExpenseReportState,
  formData: FormData,
): Promise<TakeOverExpenseReportState> {
  const admin = await requireAdmin();

  const parsed = parseTakeOverExpenseReportForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, status: true },
  });
  if (!report) {
    return { ok: false, error: "Note de frais introuvable." };
  }
  try {
    assertExpenseReportTransition({
      from: report.status,
      to: "TAKEN_OVER",
      actor: { type: "ADMIN" },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return {
      ok: false,
      error: "Cette Note de frais n'est pas en attente de prise en charge.",
    };
  }

  await prisma.expenseReport.update({
    where: { id: report.id },
    data: {
      status: "TAKEN_OVER",
      takenByAdminId: admin.id,
      takenAt: new Date(),
    },
  });

  revalidatePath(`/app/admin/notes-de-frais/${report.id}`);
  revalidatePath("/app/admin/notes-de-frais");

  return { ok: true };
}
