export type ExpenseRow = {
  date: string;
  description: string;
  amount: string;
};

export type ExpenseReportPdfData = {
  reportDate: string;
  authorName: string;
  fundingName: string;
  grantName: string;
  associationName: string;
  reimbursedAssociationName: string;
  grantedExpenses: ExpenseRow[];
  reimbursedExpenses: ExpenseRow[];
  expensesToReimburse: ExpenseRow[];
  grantedTotal: string;
  remainingTotal: string;
  reimbursementTotal: string;
  grantBalance: string;
  paymentMethod: "cash" | "cheque" | "transfer";
  chequeOrder?: string;
  iban?: string;
  recipientName: string;
  treasurerName: string;
  /** Présent uniquement sur un document reconstitué après perte du fichier original (cf. regenerate-expense-report-pdf.ts). */
  reconstitutionNote?: string;
};
