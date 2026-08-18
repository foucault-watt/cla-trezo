import { z } from "zod";

const requiredText = z.string().trim().min(1).max(500);
const optionalText = z.string().trim().max(500);

export const conventionExpenseRowSchema = z.object({
  grantedOn: requiredText,
  description: requiredText,
  amount: requiredText,
});

const conventionPartySchema = z.object({
  associationName: requiredText,
  address: requiredText,
  representatives: z
    .array(z.object({ name: requiredText, role: requiredText }))
    .min(1)
    .max(10),
});

const conventionSignatureSchema = z.object({
  associationName: requiredText,
  signatoryName: requiredText,
  signatoryRole: requiredText,
  city: requiredText,
  date: requiredText,
});

const beneficiarySignatureSchema = z.object({
  associationName: requiredText,
  signatoryName: optionalText,
  signatoryRole: optionalText,
  city: optionalText,
  date: requiredText,
});

export const subsidyConventionPdfDataSchema = z.object({
  period: requiredText,
  firstParty: conventionPartySchema,
  secondParty: conventionPartySchema,
  expenses: z.array(conventionExpenseRowSchema),
  totalAmount: requiredText,
  firstPartySignature: conventionSignatureSchema,
  secondPartySignature: beneficiarySignatureSchema,
});
