import { z } from "zod";

export const addSupportingDocumentsAsAdminFormSchema = z.object({
  expenseReportId: z.string().uuid(),
  documentType: z.enum(["RECEIPT", "HONOR_STATEMENT"]),
});

export function parseAddSupportingDocumentsAsAdminForm(formData: FormData) {
  return addSupportingDocumentsAsAdminFormSchema.safeParse({
    expenseReportId: formData.get("expenseReportId"),
    documentType: formData.get("documentType"),
  });
}

export const removeSupportingDocumentAsAdminFormSchema = z.object({
  id: z.string().uuid(),
});

export function parseRemoveSupportingDocumentAsAdminForm(formData: FormData) {
  return removeSupportingDocumentAsAdminFormSchema.safeParse({
    id: formData.get("id"),
  });
}
