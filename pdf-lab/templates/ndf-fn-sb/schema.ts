import { z } from "zod";

const requiredText = z.string().trim().min(1).max(500);
const optionalText = z.string().trim().max(500).optional();

export const expenseRowSchema = z.object({
  date: requiredText,
  description: requiredText,
  amount: requiredText,
});

export const expenseReportPdfDataSchema = z.object({
  reportDate: requiredText,
  authorName: requiredText,
  fundingName: requiredText,
  grantName: requiredText,
  associationName: requiredText,
  reimbursedAssociationName: requiredText,
  grantedExpenses: z.array(expenseRowSchema),
  reimbursedExpenses: z.array(expenseRowSchema),
  expensesToReimburse: z.array(expenseRowSchema),
  grantedTotal: requiredText,
  remainingTotal: requiredText,
  reimbursementTotal: requiredText,
  grantBalance: requiredText,
  paymentMethod: z.enum(["cash", "cheque", "transfer"]),
  chequeOrder: optionalText,
  iban: optionalText,
  recipientName: requiredText,
  treasurerName: requiredText,
});
