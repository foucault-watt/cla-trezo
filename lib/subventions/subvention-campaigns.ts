import type { VisibleSubvention } from "./visible-subventions";

/**
 * Bandage par âge d'une Campagne de subvention (par date de PUBLICATION,
 * jamais la date de campagne elle-même) : "recent" reste dépliée par défaut,
 * "old" est repliée avec un style d'avertissement, "history" est repliée et
 * présentée en version compacte. Mêmes seuils que
 * lib/expense-reports/line-warnings.ts (fenêtre de financement à 2 ans),
 * partagés entre la page Structure (/subventions, SubventionsLedger) et
 * l'onglet Subventions de la page Admin détail d'Asso — extrait ici pour ne
 * pas dupliquer la logique de bandage entre les deux vues.
 */
export type SubventionAgeBand = "recent" | "old" | "history";

export const SUBVENTION_RECENT_DAYS = 365;
export const SUBVENTION_OLD_DAYS = 730;

const DAY_MS = 24 * 60 * 60 * 1000;

export function getSubventionCampaignAgeBand(
  publicationDate: Date,
  now: Date = new Date(),
): SubventionAgeBand {
  const ageInDays = (now.getTime() - publicationDate.getTime()) / DAY_MS;
  if (ageInDays <= SUBVENTION_RECENT_DAYS) return "recent";
  if (ageInDays <= SUBVENTION_OLD_DAYS) return "old";
  return "history";
}

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
 * Répartit les Campagnes (déjà groupées) dans leurs 3 bandes d'âge.
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
    result[getSubventionCampaignAgeBand(campaign.publicationDate, now)].push(
      campaign,
    );
  }
  return result;
}
