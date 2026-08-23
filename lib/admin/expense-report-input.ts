import { z } from "zod";
import {
  ibanSchema,
  nullableUuid,
  reimbursementBaseSchema,
  reimbursementFormValues,
  refineExpenseReportLine,
} from "@/lib/expense-reports/expense-report-input";

export const updateExpenseReportAsAdminFormSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export function parseUpdateExpenseReportAsAdminForm(formData: FormData) {
  return updateExpenseReportAsAdminFormSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description"),
  });
}

export const updateExpenseReportBeneficiaryAsAdminFormSchema = z
  .object({
    id: z.string().uuid(),
    beneficiaryKind: z.enum(["MEMBER", "CUSTOM"]),
    beneficiaryUserId: nullableUuid(),
    beneficiaryFirstname: z.string().trim().min(1).max(100),
    beneficiaryLastname: z.string().trim().min(1).max(100),
    beneficiaryIban: ibanSchema,
  })
  .refine(
    (data) =>
      data.beneficiaryKind === "MEMBER"
        ? Boolean(data.beneficiaryUserId)
        : data.beneficiaryUserId === null,
    { message: "Choisissez un membre valide.", path: ["beneficiaryUserId"] },
  );

export function parseUpdateExpenseReportBeneficiaryAsAdminForm(
  formData: FormData,
) {
  return updateExpenseReportBeneficiaryAsAdminFormSchema.safeParse({
    id: formData.get("id"),
    beneficiaryKind: formData.get("beneficiaryKind"),
    beneficiaryUserId: formData.get("beneficiaryUserId"),
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
