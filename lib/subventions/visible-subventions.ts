import type { SubventionType } from "@/app/generated/prisma/enums";
import { requireStructureAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export type VisibleSubvention = {
  id: string;
  campaignName: string;
  type: SubventionType;
  reason: string;
  totalAmountCents: number;
  usedAmountCents: number;
  remainingAmountCents: number;
  commentary: string | null;
  publicationDate: Date;
};

/**
 * Subventions visibles par la Structure bénéficiaire : uniquement celles
 * dont la Campagne est Publiée (cf. lib/subventions/status.ts). Le montant
 * utilisé est toujours 0 pour l'instant, faute de consommation via les
 * Notes de frais (T9+).
 */
export async function listVisibleSubventions(
  assoSlug: string,
): Promise<VisibleSubvention[]> {
  const { structure } = await requireStructureAccess(assoSlug);
  const now = new Date();

  const subventions = await prisma.subvention.findMany({
    where: {
      assoId: structure.assoId,
      campaign: { publicationDate: { not: null, lte: now } },
    },
    orderBy: { createdAt: "desc" },
    include: { campaign: { select: { name: true, type: true, publicationDate: true } } },
  });

  return subventions.map((s) => ({
    id: s.id,
    campaignName: s.campaign.name,
    type: s.campaign.type,
    reason: s.reason,
    totalAmountCents: s.amountCents,
    usedAmountCents: 0,
    remainingAmountCents: s.amountCents,
    commentary: s.commentary,
    publicationDate: s.campaign.publicationDate as Date,
  }));
}
