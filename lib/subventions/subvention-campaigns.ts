import { getSubventionAgeBand, type SubventionAgeBand } from "./subvention-age";
import type { VisibleSubvention } from "./visible-subventions";

export type SubventionCampaignGroup = {
  id: string;
  name: string;
  type: VisibleSubvention["type"];
  publicationDate: Date;
  subventions: VisibleSubvention[];
  totalAmountCents: number;
  usedAmountCents: number;
  remainingAmountCents: number;
};

/**
 * Regroupe des Subventions par Campagne, triées de la plus récente à la plus
 * ancienne (par date de publication).
 */
export function groupSubventionsByCampaign(
  subventions: VisibleSubvention[],
): SubventionCampaignGroup[] {
  const groups = new Map<string, SubventionCampaignGroup>();

  for (const subvention of subventions) {
    const existing = groups.get(subvention.campaignId);
    if (existing) {
      existing.subventions.push(subvention);
      existing.totalAmountCents += subvention.totalAmountCents;
      existing.usedAmountCents += subvention.usedAmountCents;
      existing.remainingAmountCents += subvention.remainingAmountCents;
      continue;
    }

    groups.set(subvention.campaignId, {
      id: subvention.campaignId,
      name: subvention.campaignName,
      type: subvention.type,
      publicationDate: subvention.publicationDate,
      subventions: [subvention],
      totalAmountCents: subvention.totalAmountCents,
      usedAmountCents: subvention.usedAmountCents,
      remainingAmountCents: subvention.remainingAmountCents,
    });
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.publicationDate.getTime() - a.publicationDate.getTime(),
  );
}

/**
 * Répartit les Campagnes (déjà groupées) dans leurs 3 bandes d'âge (cf.
 * lib/subventions/subvention-age.ts), partagé entre la page Structure
 * (/subventions, SubventionsLedger) et l'onglet Subventions de la page Admin
 * détail d'Asso.
 */
export function splitSubventionCampaignsByAge(
  subventions: VisibleSubvention[],
  now: Date = new Date(),
): Record<SubventionAgeBand, SubventionCampaignGroup[]> {
  const result: Record<SubventionAgeBand, SubventionCampaignGroup[]> = {
    recent: [],
    old: [],
    history: [],
  };

  for (const campaign of groupSubventionsByCampaign(subventions)) {
    result[getSubventionAgeBand(campaign.publicationDate, now)].push(campaign);
  }
  return result;
}
