import type { SubventionType } from "@/app/generated/prisma/enums";
import { requireAdmin, requireStructureAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { subventionUsedCentsById } from "@/lib/solde/solde";
import { isSubventionStale } from "./subvention-age";

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
  /** Cf. lib/subventions/subvention-age.ts : publiée il y a plus d'un an. */
  stale: boolean;
};

/**
 * Cœur du calcul, indépendant de l'acteur qui consulte : la Structure
 * bénéficiaire (listVisibleSubventions) et l'Admin qui édite une Note Prise
 * en charge (listVisibleSubventionsForAdmin, cf. #18) partagent exactement
 * la même vue, seul le contrôle d'accès en amont diffère.
 */
async function listVisibleSubventionsForAsso(
  assoId: string,
): Promise<VisibleSubvention[]> {
  const now = new Date();

  const subventions = await prisma.subvention.findMany({
    where: {
      assoId,
      campaign: { publicationDate: { not: null, lte: now } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      campaign: {
        select: { name: true, type: true, publicationDate: true },
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
      stale: isSubventionStale(s.campaign.publicationDate, now),
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
