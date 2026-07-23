export type CampaignStatus = "PROGRAMMEE" | "PUBLIEE";

export const campaignStatusLabel: Record<CampaignStatus, string> = {
  PROGRAMMEE: "Programmée",
  PUBLIEE: "Publiée",
};

export const campaignStatusBadgeClass: Record<CampaignStatus, string> = {
  PROGRAMMEE: "badge-warning",
  PUBLIEE: "badge-success",
};

export const campaignStatusDotClass: Record<CampaignStatus, string> = {
  PROGRAMMEE: "bg-warning",
  PUBLIEE: "bg-success",
};

/**
 * Statut dérivé d'une Campagne : pas de colonne dédiée en base, cf. domaine
 * (CONTEXT.md). Sans date de publication, une campagne n'est pas encore
 * utilisable par la Structure, donc Programmée au même titre qu'une date
 * future.
 */
export function getCampaignStatus(
  publicationDate: Date | null,
  now: Date = new Date(),
): CampaignStatus {
  if (!publicationDate || publicationDate > now) {
    return "PROGRAMMEE";
  }
  return "PUBLIEE";
}
