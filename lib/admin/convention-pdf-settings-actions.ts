"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { saveConventionPdfSettings } from "./convention-pdf-settings";
import { parseConventionPdfSettingsForm } from "./convention-pdf-settings-input";

export type ConventionPdfSettingsState = {
  ok: boolean;
  error?: string;
};

export async function saveConventionPdfSettingsAction(
  _previousState: ConventionPdfSettingsState,
  formData: FormData,
): Promise<ConventionPdfSettingsState> {
  await requireAdmin();

  const parsed = parseConventionPdfSettingsForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Les paramètres de la convention sont invalides.",
    };
  }

  await saveConventionPdfSettings(parsed.data);
  revalidatePath("/app/admin/parametres-pdf");

  return { ok: true };
}
