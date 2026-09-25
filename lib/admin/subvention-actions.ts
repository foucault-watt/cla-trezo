"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { toAmountCents } from "@/lib/money";
import {
  parseSubventionForm,
  parseSubventionUpdateForm,
  parseSubventionDeleteForm,
} from "./subvention-input";

export type AddSubventionState = {
  ok: boolean;
  error?: string;
  subvention?: {
    id: string;
    assoId: string;
    reason: string;
    amountCents: number;
    commentary: string | null;
  };
};

/**
 * Ajoute une Subvention accordée à une Structure dans le cadre d'une
 * Campagne existante. Une même Campagne peut porter plusieurs Subventions
 * pour la même Structure (ex : deux demandes distinctes dans la même
 * campagne CA Event) — pas de contrainte d'unicité.
 */
export async function addSubventionAction(
  _prevState: AddSubventionState,
  formData: FormData,
): Promise<AddSubventionState> {
  await requireAdmin();

  const parsed = parseSubventionForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const campaign = await prisma.subventionCampaign.findUnique({
    where: { id: parsed.data.campaignId },
    select: { id: true },
  });
  if (!campaign) {
    return { ok: false, error: "Campagne introuvable." };
  }

  const subvention = await prisma.subvention.create({
    data: {
      campaignId: parsed.data.campaignId,
      assoId: parsed.data.assoId,
      reason: parsed.data.reason,
      amountCents: toAmountCents(parsed.data.amount),
      commentary: parsed.data.commentary,
    },
  });

  // Pas de revalidatePath sur la page de détail de Campagne : le client met
  // à jour l'affichage directement avec la ligne créée (cf. SubventionsPanel)
  // pour éviter d'attendre le re-rendu serveur complet à chaque ajout. La
  // page de liste des campagnes reste revalidée pour ses totaux agrégés.
  revalidatePath("/app/admin/subventions");

  return {
    ok: true,
    subvention: {
      id: subvention.id,
      assoId: subvention.assoId,
      reason: subvention.reason,
      amountCents: subvention.amountCents,
      commentary: subvention.commentary,
    },
  };
}

export type UpdateSubventionState = { ok: boolean; error?: string };

/**
 * Modifie une Subvention déjà accordée (raison, montant, commentaire). La
 * Structure et la Campagne d'origine ne changent pas : seule la ligne
 * accordée est corrigée, ex. en cas d'erreur de saisie.
 */
export async function updateSubventionAction(
  _prevState: UpdateSubventionState,
  formData: FormData,
): Promise<UpdateSubventionState> {
  await requireAdmin();

  const parsed = parseSubventionUpdateForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  await prisma.subvention.update({
    where: { id: parsed.data.id },
    data: {
      reason: parsed.data.reason,
      amountCents: toAmountCents(parsed.data.amount),
      commentary: parsed.data.commentary,
    },
  });

  revalidatePath(`/app/admin/subventions/${parsed.data.campaignId}`);
  revalidatePath("/app/admin/subventions");

  return { ok: true };
}

export type DeleteSubventionState = { ok: boolean; error?: string };

/**
 * Supprime une Subvention. Refusée si elle est déjà consommée (par une
 * ligne de Note de frais ou un Mouvement financier) pour ne pas casser le
 * calcul du montant utilisé.
 */
export async function deleteSubventionAction(
  _prevState: DeleteSubventionState,
  formData: FormData,
): Promise<DeleteSubventionState> {
  await requireAdmin();

  const parsed = parseSubventionDeleteForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const subvention = await prisma.subvention.findUnique({
    where: { id: parsed.data.id },
    select: {
      _count: { select: { expenseReportLines: true, financialMovements: true } },
    },
  });
  if (!subvention) {
    return { ok: false, error: "Subvention introuvable." };
  }
  if (
    subvention._count.expenseReportLines > 0 ||
    subvention._count.financialMovements > 0
  ) {
    return {
      ok: false,
      error: "Cette Subvention est déjà utilisée, impossible de la supprimer.",
    };
  }

  await prisma.subvention.delete({ where: { id: parsed.data.id } });

  revalidatePath(`/app/admin/subventions/${parsed.data.campaignId}`);
  revalidatePath("/app/admin/subventions");

  return { ok: true };
}
