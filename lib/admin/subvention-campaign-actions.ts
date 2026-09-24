"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage/file-storage";
import {
  parseSubventionCampaignForm,
  parseSubventionCampaignUpdateForm,
  parseSubventionCampaignDeleteForm,
} from "./subvention-campaign-input";

export type CreateSubventionCampaignState = {
  ok: boolean;
  error?: string;
  campaignId?: string;
};

export async function createSubventionCampaignAction(
  _prevState: CreateSubventionCampaignState,
  formData: FormData,
): Promise<CreateSubventionCampaignState> {
  await requireAdmin();

  const parsed = parseSubventionCampaignForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const campaign = await prisma.subventionCampaign.create({
    data: {
      type: parsed.data.type,
      name: parsed.data.name,
      date: parsed.data.date,
      publicationDate: parsed.data.publicationDate,
    },
  });

  revalidatePath("/app/admin/subventions");

  return { ok: true, campaignId: campaign.id };
}

export type UpdateSubventionCampaignState = { ok: boolean; error?: string };

/**
 * Modifie une Campagne existante, notamment sa date de publication : c'est
 * le seul moyen de faire passer une Campagne de Programmée à Publiée après
 * coup (cf. lib/subventions/status.ts).
 */
export async function updateSubventionCampaignAction(
  _prevState: UpdateSubventionCampaignState,
  formData: FormData,
): Promise<UpdateSubventionCampaignState> {
  await requireAdmin();

  const parsed = parseSubventionCampaignUpdateForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  await prisma.subventionCampaign.update({
    where: { id: parsed.data.campaignId },
    data: {
      type: parsed.data.type,
      name: parsed.data.name,
      date: parsed.data.date,
      publicationDate: parsed.data.publicationDate,
    },
  });

  revalidatePath(`/app/admin/subventions/${parsed.data.campaignId}`);
  revalidatePath("/app/admin/subventions");

  return { ok: true };
}

export type DeleteSubventionCampaignState = { ok: boolean; error?: string };

/**
 * Supprime une Campagne et toutes ses Subventions. Refusée si l'une des
 * Subventions est déjà utilisée (par une Ligne de Note de frais ou un
 * Mouvement financier), même raison que deleteSubventionAction — sinon la
 * suppression casserait silencieusement le calcul du montant utilisé.
 */
export async function deleteSubventionCampaignAction(
  _prevState: DeleteSubventionCampaignState,
  formData: FormData,
): Promise<DeleteSubventionCampaignState> {
  await requireAdmin();

  const parsed = parseSubventionCampaignDeleteForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
    };
  }

  const campaign = await prisma.subventionCampaign.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, grantDocuments: { select: { filePath: true } } },
  });
  if (!campaign) {
    return { ok: false, error: "Campagne introuvable." };
  }

  const usedSubventionsCount = await prisma.subvention.count({
    where: {
      campaignId: campaign.id,
      OR: [
        { expenseReportLines: { some: {} } },
        { financialMovements: { some: {} } },
      ],
    },
  });
  if (usedSubventionsCount > 0) {
    return {
      ok: false,
      error:
        "Cette Campagne contient des Subventions déjà utilisées, impossible de la supprimer.",
    };
  }

  // Les Documents d'octroi ne sont pas figés (ADR-0007) : ils disparaissent
  // avec leur Campagne, fichiers compris une fois la suppression validée.
  await prisma.$transaction([
    prisma.grantDocument.deleteMany({ where: { campaignId: campaign.id } }),
    prisma.subvention.deleteMany({ where: { campaignId: campaign.id } }),
    prisma.subventionCampaign.delete({ where: { id: campaign.id } }),
  ]);
  await Promise.allSettled(
    campaign.grantDocuments.map((document) =>
      deleteStoredFile(document.filePath),
    ),
  );

  revalidatePath("/app/admin/subventions");

  const toastParams = new URLSearchParams({
    toast: "Campagne supprimée.",
    toastType: "success",
  });
  redirect(`/app/admin/subventions?${toastParams.toString()}`);
}
