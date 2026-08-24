import { z } from "zod";

const requiredText = z.string().trim().min(1).max(500);

export const financementExpenseRowSchema = z.object({
  date: requiredText,
  description: requiredText,
  amount: requiredText,
});

export const financementPdfDataSchema = z.object({
  period: requiredText,
  associationName: requiredText,
  associationStatus: requiredText,
  requestContext: requiredText,
  expenses: z.array(financementExpenseRowSchema),
  total: requiredText,
  usageDeadline: requiredText,
  responsibleName: requiredText,
  secretaryName: requiredText,
});
