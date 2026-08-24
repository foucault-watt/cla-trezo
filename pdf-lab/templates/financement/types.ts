export type FinancementExpenseRow = {
  date: string;
  description: string;
  amount: string;
};

export type FinancementPdfData = {
  period: string;
  associationName: string;
  associationStatus: string;
  requestContext: string;
  expenses: FinancementExpenseRow[];
  total: string;
  usageDeadline: string;
  responsibleName: string;
  secretaryName: string;
};
