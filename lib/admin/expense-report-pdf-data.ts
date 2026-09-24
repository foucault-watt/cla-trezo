import { formatCentsForPdf } from "@/lib/money";
import type { ExpenseReportPdfData, ExpenseRow } from "@/pdf-lab/templates/ndf-fn-sb/types";
import type { ExpenseBalancePdfData } from "@/pdf-lab/templates/ndf-solde/types";
import { formatConventionDate } from "./subsidy-convention";

/**
 * Informations partagées par tous les PDF finaux d'une même Note (un
 * bénéficiaire unique par Note, cf. ADR-0002) : indépendantes du groupe
 * (Subvention ou Solde) pour lequel le PDF est généré.
 */
export type PdfBeneficiaryContext = {
  reportDate: Date;
  beneficiaryName: string;
  associationName: string;
  iban: string | null;
  treasurerName: string;
  /** Présent uniquement lors d'une reconstitution suite à une perte du fichier original (cf. regenerate-expense-report-pdf.ts). */
  reconstitutionNote?: string;
};

export type SubventionGrantContext = {
  reason: string;
  amountCents: number;
};

export type PdfExpenseInput = {
  amountCents: number;
  date: Date | null;
  description: string;
};

function toRow(expense: PdfExpenseInput, fallbackDate: Date): ExpenseRow {
  return {
    date: formatConventionDate(expense.date ?? fallbackDate),
    description: expense.description,
    amount: formatCentsForPdf(expense.amountCents),
  };
}

function sumCents(expenses: { amountCents: number }[]): number {
  return expenses.reduce((total, expense) => total + expense.amountCents, 0);
}

/**
 * Données du PDF final pour un groupe Subvention (template ndf-fn-sb) :
 * `campaignSubventions` couvre toutes les Subventions de la Campagne
 * accordées à la Structure (story #4), `reimbursedHistory` l'historique des
 * Remboursements déjà Validés sur cette Subvention (story #5), et
 * `linesToReimburse` les Lignes de la Note en cours de validation qui la
 * financent. `grantBalance` (solde après cette Note, story #6) se déduit du
 * solde avant Note (`remainingTotal`) moins ce qui est remboursé maintenant.
 */
export function buildSubventionPdfData({
  context,
  campaignName,
  grantReason,
  campaignGrantedOn,
  campaignSubventions,
  reimbursedHistory,
  linesToReimburse,
}: {
  context: PdfBeneficiaryContext;
  campaignName: string;
  grantReason: string;
  campaignGrantedOn: Date;
  campaignSubventions: SubventionGrantContext[];
  reimbursedHistory: PdfExpenseInput[];
  linesToReimburse: PdfExpenseInput[];
}): ExpenseReportPdfData {
  const grantedTotalCents = sumCents(campaignSubventions);
  const reimbursedTotalCents = sumCents(reimbursedHistory);
  const reimbursementTotalCents = sumCents(linesToReimburse);
  const remainingBeforeCents = grantedTotalCents - reimbursedTotalCents;
  const remainingAfterCents = remainingBeforeCents - reimbursementTotalCents;

  return {
    reportDate: formatConventionDate(context.reportDate),
    authorName: context.beneficiaryName,
    fundingName: campaignName,
    grantName: grantReason,
    associationName: context.associationName,
    reimbursedAssociationName: context.associationName,
    grantedExpenses: campaignSubventions.map((subvention) => ({
      date: formatConventionDate(campaignGrantedOn),
      description: subvention.reason,
      amount: formatCentsForPdf(subvention.amountCents),
    })),
    reimbursedExpenses: reimbursedHistory.map((expense) =>
      toRow(expense, context.reportDate),
    ),
    expensesToReimburse: linesToReimburse.map((expense) =>
      toRow(expense, context.reportDate),
    ),
    grantedTotal: formatCentsForPdf(grantedTotalCents),
    remainingTotal: formatCentsForPdf(remainingBeforeCents),
    reimbursementTotal: formatCentsForPdf(reimbursementTotalCents),
    grantBalance: formatCentsForPdf(remainingAfterCents),
    paymentMethod: "transfer",
    iban: context.iban ?? undefined,
    recipientName: context.beneficiaryName,
    treasurerName: context.treasurerName,
    reconstitutionNote: context.reconstitutionNote,
  };
}

/**
 * Données du PDF final pour le groupe Solde (template ndf-solde) : une
 * simple liste des Lignes financées par le Solde de la Note en cours de
 * validation.
 */
export function buildSoldePdfData({
  context,
  lines,
}: {
  context: PdfBeneficiaryContext;
  lines: PdfExpenseInput[];
}): ExpenseBalancePdfData {
  return {
    reportDate: formatConventionDate(context.reportDate),
    authorName: context.beneficiaryName,
    associationName: context.associationName,
    expenses: lines.map((expense) => toRow(expense, context.reportDate)),
    total: formatCentsForPdf(sumCents(lines)),
    paymentMethod: "transfer",
    iban: context.iban ?? undefined,
    recipientName: context.beneficiaryName,
    treasurerName: context.treasurerName,
    reconstitutionNote: context.reconstitutionNote,
  };
}
