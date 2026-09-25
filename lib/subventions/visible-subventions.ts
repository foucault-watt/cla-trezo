import type { SubventionType } from "@/app/generated/prisma/enums";
import { requireAdmin, requireStructureAccess } from "@/lib/auth/guards";
import {
  fundingWindowCutoff,
  isSubventionStale,
} from "@/lib/expense-reports/line-warnings";
import { prisma } from "@/lib/prisma";
import { subventionUsedCentsById } from "@/lib/solde/solde";

export type VisibleSubvention = {
  id: string;
  campaignId: string;
  campaignName: string;
  type: SubventionType;
  reason: string;
  totalAmountCents: number;
  usedAmountCents: number;
  remainingAmountCents: number;
  commentary: string | null;
  publicationDate: Date;
  campaignDate: Date;
  /** Cf. lib/expense-reports/line-warnings.ts : Campagne datée de plus d'un an. */
  stale: boolean;
};

/**
 * Cœur du calcul, indépendant de l'acteur qui consulte : la Structure
 * bénéficiaire (listVisibleSubventions) et l'Admin qui édite une Note Prise
 * en charge (listVisibleSubventionsForAdmin, cf. #18) partagent exactement
 * la même vue, seul le contrôle d'accès en amont diffère.
 *
 * `scope` filtre par date de Campagne, directement dans la requête, pour ne
 * pas charger (Subvention + agrégation FinancialMovement) l'historique
 * complet quand seules les Subventions actuelles sont affichées — cf.
 * listCurrentSubventions / listHistoricalSubventions. Omis (`undefined`) :
 * aucune coupure, comportement historique de listVisibleSubventions(ForAdmin).
 */
async function listVisibleSubventionsForAsso(
  assoId: string,
  scope?: "current" | "historical",
): Promise<VisibleSubvention[]> {
  const now = new Date();
  const cutoff = fundingWindowCutoff(now);
  const campaignDateFilter =
    scope === "current"
      ? { gte: cutoff }
      : scope === "historical"
        ? { lt: cutoff }
        : undefined;

  const subventions = await prisma.subvention.findMany({
    where: {
      assoId,
      campaign: {
        publicationDate: { not: null, lte: now },
        ...(campaignDateFilter && { date: campaignDateFilter }),
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      campaign: {
        select: { name: true, type: true, publicationDate: true, date: true },
      },
    },
  });

  if (subventions.length === 0) return [];

  const movements = await prisma.financialMovement.findMany({
    where: {
      accountType: "SUBVENTION",
      subventionId: { in: subventions.map((s) => s.id) },
    },
    select: { subventionId: true, movementType: true, amountCents: true },
  });

  const usedCentsBySubventionId = subventionUsedCentsById(movements);

  return subventions.map((s) => {
    const usedAmountCents = usedCentsBySubventionId.get(s.id) ?? 0;
    return {
      id: s.id,
      campaignId: s.campaignId,
      campaignName: s.campaign.name,
      type: s.campaign.type,
      reason: s.reason,
      totalAmountCents: s.amountCents,
      usedAmountCents,
      remainingAmountCents: s.amountCents - usedAmountCents,
      commentary: s.commentary,
      publicationDate: s.campaign.publicationDate as Date,
      campaignDate: s.campaign.date,
      stale: isSubventionStale(s.campaign.date, now),
    };
  });
}

/**
 * Subventions visibles par la Structure bénéficiaire : uniquement celles
 * dont la Campagne est Publiée (cf. lib/subventions/status.ts). Le montant
 * utilisé vient des FinancialMovement Validés (mouvements EXPENSE_REPORT
 * créés à la Validation d'une Note, cf. ADR-0003) ; il ne reflète donc pas
 * encore les Lignes en Brouillon/Soumise/Prise en charge — c'est le rôle des
 * Warnings T13-T15, pas de cette vue.
 */
export async function listVisibleSubventions(
  assoSlug: string,
): Promise<VisibleSubvention[]> {
  const { structure } = await requireStructureAccess(assoSlug);
  return listVisibleSubventionsForAsso(structure.assoId);
}

/**
 * Même vue que listVisibleSubventions, pour l'Admin qui édite une Note de
 * frais Prise en charge (#18) : celui-ci n'est rattaché à aucune Structure,
 * donc scopé directement par assoId (déduit de la Note) plutôt que par
 * assoSlug.
 */
export async function listVisibleSubventionsForAdmin(
  assoId: string,
): Promise<VisibleSubvention[]> {
  await requireAdmin();
  return listVisibleSubventionsForAsso(assoId);
}

/**
 * Subventions "actuelles" (cf. isSubventionWithinFundingWindow) pour l'écran
 * de consultation dédié (T7, page /subventions) : ce qui s'affiche par
 * défaut, sans charger l'historique au-delà de 2 ans — cf.
 * listHistoricalSubventions pour le chargement à la demande de ce dernier.
 */
export async function listCurrentSubventions(
  assoSlug: string,
): Promise<VisibleSubvention[]> {
  const { structure } = await requireStructureAccess(assoSlug);
  return listVisibleSubventionsForAsso(structure.assoId, "current");
}

/**
 * Historique (au-delà de la fenêtre de 2 ans) pour l'écran de consultation
 * dédié (T7) : chargé à la demande (section repliée par défaut), jamais au
 * chargement initial de la page — cf. listCurrentSubventions.
 */
export async function listHistoricalSubventions(
  assoSlug: string,
): Promise<VisibleSubvention[]> {
  const { structure } = await requireStructureAccess(assoSlug);
  return listVisibleSubventionsForAsso(structure.assoId, "historical");
}
