import { z } from "zod";
import {
  expenseReportLineBaseSchema,
  ibanSchema,
  reimbursementBaseSchema,
  reimbursementFormValues,
  refineExpenseReportLine,
} from "@/lib/expense-reports/expense-report-input";

export const updateExpenseReportBeneficiaryAsAdminFormSchema = z.object({
  id: z.string().uuid(),
  beneficiaryFirstname: z.string().trim().min(1).max(100),
  beneficiaryLastname: z.string().trim().min(1).max(100),
  beneficiaryIban: ibanSchema,
});

export function parseUpdateExpenseReportBeneficiaryAsAdminForm(
  formData: FormData,
) {
  return updateExpenseReportBeneficiaryAsAdminFormSchema.safeParse({
    id: formData.get("id"),
    beneficiaryFirstname: formData.get("beneficiaryFirstname"),
    beneficiaryLastname: formData.get("beneficiaryLastname"),
    beneficiaryIban: formData.get("beneficiaryIban"),
  });
}

export const takeOverExpenseReportFormSchema = z.object({
  id: z.string().uuid(),
});

export type TakeOverExpenseReportFormInput = z.infer<
  typeof takeOverExpenseReportFormSchema
>;

export function parseTakeOverExpenseReportForm(formData: FormData) {
  return takeOverExpenseReportFormSchema.safeParse({
    id: formData.get("id"),
  });
}

// Pas de assoSlug (contrairement aux formulaires Structure) : la page Admin
// n'est pas scopée à une Structure, l'Association de la Ligne se déduit de
// la Note de frais elle-même (cf. lib/admin/expense-report-actions.ts).

export const addExpenseReportLineAsAdminFormSchema = refineExpenseReportLine(
  expenseReportLineBaseSchema.extend({
    expenseReportId: z.string().uuid(),
  }),
);

export type AddExpenseReportLineAsAdminFormInput = z.infer<
  typeof addExpenseReportLineAsAdminFormSchema
>;

export function parseAddExpenseReportLineAsAdminForm(formData: FormData) {
  return addExpenseReportLineAsAdminFormSchema.safeParse({
    expenseReportId: formData.get("expenseReportId"),
    beneficiaryFirstname: formData.get("beneficiaryFirstname"),
    beneficiaryLastname: formData.get("beneficiaryLastname"),
    iban: formData.get("iban"),
    amount: formData.get("amount"),
    expenseName: formData.get("expenseName"),
    typeDepenseId: formData.get("typeDepenseId"),
    customLabel: formData.get("customLabel"),
    fundingSource: formData.get("fundingSource"),
    subventionId: formData.get("subventionId"),
  });
}

export const updateExpenseReportLineAsAdminFormSchema = refineExpenseReportLine(
  expenseReportLineBaseSchema.extend({
    id: z.string().uuid(),
  }),
);

export type UpdateExpenseReportLineAsAdminFormInput = z.infer<
  typeof updateExpenseReportLineAsAdminFormSchema
>;

export function parseUpdateExpenseReportLineAsAdminForm(formData: FormData) {
  return updateExpenseReportLineAsAdminFormSchema.safeParse({
    id: formData.get("id"),
    beneficiaryFirstname: formData.get("beneficiaryFirstname"),
    beneficiaryLastname: formData.get("beneficiaryLastname"),
    iban: formData.get("iban"),
    amount: formData.get("amount"),
    expenseName: formData.get("expenseName"),
    typeDepenseId: formData.get("typeDepenseId"),
    customLabel: formData.get("customLabel"),
    fundingSource: formData.get("fundingSource"),
    subventionId: formData.get("subventionId"),
  });
}

export const deleteExpenseReportLineAsAdminFormSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteExpenseReportLineAsAdminFormInput = z.infer<
  typeof deleteExpenseReportLineAsAdminFormSchema
>;

export function parseDeleteExpenseReportLineAsAdminForm(formData: FormData) {
  return deleteExpenseReportLineAsAdminFormSchema.safeParse({
    id: formData.get("id"),
  });
}

export const addReimbursementAsAdminFormSchema = refineExpenseReportLine(
  reimbursementBaseSchema.extend({ expenseReportId: z.string().uuid() }),
);

export const updateReimbursementAsAdminFormSchema = refineExpenseReportLine(
  reimbursementBaseSchema.extend({ id: z.string().uuid() }),
);

export function parseAddReimbursementAsAdminForm(formData: FormData) {
  return addReimbursementAsAdminFormSchema.safeParse({
    expenseReportId: formData.get("expenseReportId"),
    ...reimbursementFormValues(formData),
  });
}

export function parseUpdateReimbursementAsAdminForm(formData: FormData) {
  return updateReimbursementAsAdminFormSchema.safeParse({
    id: formData.get("id"),
    ...reimbursementFormValues(formData),
  });
}
