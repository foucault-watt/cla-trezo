"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { parseSetAssoTypeForm } from "./asso-type-input";

export type SetAssoTypeState = { ok: boolean; error?: string };

/**
 * Classifie une Structure (Club / Commission / Association loi 1901). Peut
 * être appelé aussi bien pour la première classification (Type encore null,
 * cf. lib/auth/cla.ts) que pour corriger un choix existant plus tard.
 */
export async function setAssoTypeAction(
  _prevState: SetAssoTypeState,
  formData: FormData,
): Promise<SetAssoTypeState> {
  await requireAdmin();

  const parsed = parseSetAssoTypeForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  await prisma.asso.update({
    where: { id: parsed.data.assoId },
    data: { type: parsed.data.type },
  });

  revalidatePath(`/app/admin/associations/${parsed.data.assoSlug}`);
  revalidatePath("/app/admin/associations");

  return { ok: true };
}
