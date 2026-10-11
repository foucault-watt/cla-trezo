import type { SubventionType } from "@/app/generated/prisma/enums";

export const subventionTypeLabel: Record<SubventionType, string> = {
  CA_BUDGET: "CA Budget",
  CA_EVENT: "CA Événement",
  CA_EXCEPTIONNEL: "CA Exceptionnel",
};

/**
 * Nom complet d'une Campagne de subvention : le Type fait partie du nom (ex :
 * "CA Budget 2026"), `name` n'en stocke que la suite. À utiliser partout où le
 * nom sort de l'application (PDF, noms de fichiers) ou s'affiche sans le Type
 * à côté.
 */
export function subventionCampaignFullName(campaign: {
  type: SubventionType;
  name: string;
}): string {
  return `${subventionTypeLabel[campaign.type]} ${campaign.name}`;
}

export const subventionTypeOptions: { value: SubventionType; label: string }[] =
  (Object.keys(subventionTypeLabel) as SubventionType[]).map((value) => ({
    value,
    label: subventionTypeLabel[value],
  }));
