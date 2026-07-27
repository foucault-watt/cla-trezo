import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";

/**
 * La Structure garde la main tant que l'Admin n'a pas commencé à traiter la
 * Note (cf. ADR-0001) : Brouillon et Soumise sont modifiables, tout le reste
 * (Prise en charge, Validée, Rejetée) est verrouillé.
 */
export function isEditableExpenseReportStatus(
  status: ExpenseReportStatus,
): boolean {
  return status === "DRAFT" || status === "SUBMITTED";
}
