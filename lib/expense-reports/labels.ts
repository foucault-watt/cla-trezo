import type {
  ExpenseReportStatus,
  FundingSourceType,
} from "@/app/generated/prisma/enums";

export const fundingSourceLabel: Record<FundingSourceType, string> = {
  CLUB_BALANCE: "Solde",
  SUBVENTION: "Subvention",
};

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
  DRAFT: "badge-ghost",
  SUBMITTED: "badge-info",
  TAKEN_OVER: "badge-warning",
  FINALIZED: "badge-success",
  REJECTED: "badge-error",
};

export const expenseReportStatusDotClass: Record<ExpenseReportStatus, string> =
  {
    DRAFT: "bg-base-content/40",
    SUBMITTED: "bg-info",
    TAKEN_OVER: "bg-warning",
    FINALIZED: "bg-success",
    REJECTED: "bg-error",
  };
