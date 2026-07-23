"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  parseSubventionCampaignForm,
  parseSubventionCampaignUpdateForm,
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
