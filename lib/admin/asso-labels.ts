import type { AssoStatus, AssoType } from "@/app/generated/prisma/enums";

export const assoTypeLabel: Record<AssoType, string> = {
  CLUB: "Club",
  COMMISSION: "Commission",
  ASSOCIATION_1901: "Association loi 1901",
};

/**
 * Le Type vient du SSO CLA (cf. lib/auth/cla.ts) : seule une Structure
 * héritée que le SSO ne renvoie pas peut rester sans Type.
 */
export function assoTypeDisplayLabel(type: AssoType | null): string {
  return type ? assoTypeLabel[type] : "Non classée";
}

export const assoStatusLabel: Record<AssoStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  ARCHIVED: "Archivé",
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
