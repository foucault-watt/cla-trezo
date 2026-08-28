export type ExpenseRow = {
  date: string;
  description: string;
  amount: string;
};

export type ExpenseBalancePdfData = {
  reportDate: string;
  authorName: string;
  associationName: string;
  expenses: ExpenseRow[];
  total: string;
  paymentMethod: "cash" | "cheque" | "transfer";
  chequeOrder?: string;
  iban?: string;
  recipientName: string;
  treasurerName: string;
  /** Présent uniquement sur un document reconstitué après perte du fichier original (cf. regenerate-expense-report-pdf.ts). */
  reconstitutionNote?: string;
};
