import { z } from "zod";

export const addSupportingDocumentsFormSchema = z.object({
  expenseReportId: z.string().uuid(),
  assoSlug: z.string().min(1),
  documentType: z.enum(["RECEIPT", "HONOR_STATEMENT"]),
});

export type AddSupportingDocumentsFormInput = z.infer<
  typeof addSupportingDocumentsFormSchema
>;

export function parseAddSupportingDocumentsForm(formData: FormData) {
  return addSupportingDocumentsFormSchema.safeParse({
    expenseReportId: formData.get("expenseReportId"),
    assoSlug: formData.get("assoSlug"),
    documentType: formData.get("documentType"),
  });
}

export const removeSupportingDocumentFormSchema = z.object({
  id: z.string().uuid(),
  assoSlug: z.string().min(1),
});

export type RemoveSupportingDocumentFormInput = z.infer<
  typeof removeSupportingDocumentFormSchema
>;

export function parseRemoveSupportingDocumentForm(formData: FormData) {
  return removeSupportingDocumentFormSchema.safeParse({
    id: formData.get("id"),
    assoSlug: formData.get("assoSlug"),
  });
}
