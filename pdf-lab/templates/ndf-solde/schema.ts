import { z } from "zod";

const requiredText = z.string().trim().min(1).max(500);
const optionalText = z.string().trim().max(500).optional();

export const expenseRowSchema = z.object({
  date: requiredText,
  description: requiredText,
  amount: requiredText,
});

export const expenseBalancePdfDataSchema = z.object({
  reportDate: requiredText,
  authorName: requiredText,
  associationName: requiredText,
  expenses: z.array(expenseRowSchema),
  total: requiredText,
  paymentMethod: z.enum(["cash", "cheque", "transfer"]),
  chequeOrder: optionalText,
  iban: optionalText,
  recipientName: requiredText,
  treasurerName: requiredText,
});
