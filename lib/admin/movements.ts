"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { parseManualMovementForm, toAmountCents } from "./movement-input";

export type AddManualMovementState = { ok: boolean; error?: string };

/**
 * Entrée/Sortie manuelle sur le Solde d'un Club (cf. domaine : seul un Club
 * a un Solde). C'est le seul moyen d'initialiser un Solde côté membre
 * (lib/solde/solde.ts n'affiche rien tant qu'aucun mouvement MANUAL n'existe).
 */
export async function addManualMovementAction(
  _prevState: AddManualMovementState,
  formData: FormData,
): Promise<AddManualMovementState> {
  const admin = await requireAdmin();

  const parsed = parseManualMovementForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const asso = await prisma.asso.findUnique({
    where: { id: parsed.data.assoId },
    select: { type: true },
  });
  if (!asso || asso.type !== "CLUB") {
    return { ok: false, error: "Seuls les Clubs ont un Solde." };
  }

  await prisma.financialMovement.create({
    data: {
      assoId: parsed.data.assoId,
      movementType: parsed.data.movementType,
      accountType: "CLUB_BALANCE",
      origin: "MANUAL",
      amountCents: toAmountCents(parsed.data.amount),
      description: parsed.data.description,
      createdBy: admin.id,
      createdAt: parsed.data.date,
    },
  });

  revalidatePath(`/app/admin/associations/${parsed.data.assoSlug}`);
  revalidatePath("/app/admin/associations");

  return { ok: true };
}
