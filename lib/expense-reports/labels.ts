import type {
  ExpenseReportStatus,
  FundingSourceType,
} from "@/app/generated/prisma/enums";

export const fundingSourceLabel: Record<FundingSourceType, string> = {
  CLUB_BALANCE: "Solde",
  SUBVENTION: "Subvention",
};

/**
 * Libellé de la source de financement d'une Ligne, complété par la raison de
 * la Subvention quand elle est renseignée. Partagé par les vues Structure et
 * Admin (cf. issue #30).
 */
export function fundingSourceDetail(line: {
  fundingSource: FundingSourceType;
  subventionReason: string | null;
}): string {
  return line.fundingSource === "SUBVENTION" && line.subventionReason
    ? `${fundingSourceLabel[line.fundingSource]} — ${line.subventionReason}`
    : fundingSourceLabel[line.fundingSource];
}

/**
 * Nom court du bénéficiaire pour les vues compactes (liste des Notes) :
 * "Prénom N." — null si l'un des deux champs n'est pas encore renseigné
 * (bénéficiaire pas encore choisi à l'étape dédiée du wizard).
 */
export function beneficiaryShortName(
  firstname: string | null,
  lastname: string | null,
): string | null {
  const trimmedFirstname = firstname?.trim();
  const trimmedLastname = lastname?.trim();
  if (!trimmedFirstname || !trimmedLastname) return null;
  return `${trimmedFirstname} ${trimmedLastname.charAt(0).toUpperCase()}.`;
}

export const expenseReportStatusLabel: Record<ExpenseReportStatus, string> = {
  DRAFT: "Brouillon",
  SUBMITTED: "Soumise",
  TAKEN_OVER: "Prise en charge",
  FINALIZED: "Validée",
  REJECTED: "Rejetée",
};

export const expenseReportStatusBadgeClass: Record<
  ExpenseReportStatus,
  string
> = {
  DRAFT: "badge-neutral",
  SUBMITTED: "badge-info",
  TAKEN_OVER: "badge-warning",
  FINALIZED: "badge-success",
  REJECTED: "badge-error",
};

export const expenseReportStatusDotClass: Record<ExpenseReportStatus, string> =
  {
    DRAFT: "bg-neutral",
    SUBMITTED: "bg-info",
    TAKEN_OVER: "bg-warning",
    FINALIZED: "bg-success",
    REJECTED: "bg-error",
  };
