import type { AssoStatus, AssoType } from "@/app/generated/prisma/enums";

export const assoTypeLabel: Record<AssoType, string> = {
  CLUB: "Club",
  COMMISSION: "Commission",
  ASSOCIATION_1901: "Association loi 1901",
};

export const assoTypeDescription: Record<AssoType, string> = {
  CLUB: "Structure interne à CLA, sans compte bancaire propre ni personnalité juridique séparée. Son argent est géré par CLA et suivi via un Solde interne dans l'application.",
  COMMISSION:
    "Structure interne à CLA disposant de son propre compte bancaire ou fonctionnement financier séparé. N'a pas de Solde interne CLA ; suit uniquement des Subventions.",
  ASSOCIATION_1901:
    "Structure juridiquement indépendante de CLA, avec son propre compte bancaire. Fonctionne comme une Commission dans l'application : pas de Solde interne, suivi uniquement par Subventions.",
};

export const assoTypeOptions: {
  value: AssoType;
  label: string;
  description: string;
}[] = (Object.keys(assoTypeLabel) as AssoType[]).map((value) => ({
  value,
  label: assoTypeLabel[value],
  description: assoTypeDescription[value],
}));

export const assoStatusLabel: Record<AssoStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archivée",
};

export const assoStatusBadgeClass: Record<AssoStatus, string> = {
  ACTIVE: "badge-success",
  INACTIVE: "badge-warning",
  ARCHIVED: "badge-neutral",
};

export const assoStatusDotClass: Record<AssoStatus, string> = {
  ACTIVE: "bg-success",
  INACTIVE: "bg-warning",
  ARCHIVED: "bg-neutral",
};
