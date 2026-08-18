import { z } from "zod";

const requiredText = z
  .string()
  .trim()
  .min(1, "Ce champ est obligatoire.")
  .max(500);

export const conventionRepresentativeSchema = z.object({
  name: requiredText,
  role: requiredText,
});

export const conventionPdfSettingsSchema = z.object({
  claAssociationName: requiredText,
  claAddress: requiredText,
  claRepresentatives: z
    .array(conventionRepresentativeSchema)
    .min(1, "Ajoutez au moins un représentant de CLA."),
  claSignatoryName: requiredText,
  claSignatoryRole: requiredText,
  claSignatureCity: requiredText,
});

export type ConventionPdfSettingsInput = z.infer<
  typeof conventionPdfSettingsSchema
>;

export function parseConventionPdfSettingsForm(formData: FormData) {
  let representatives: unknown = [];
  try {
    representatives = JSON.parse(
      String(formData.get("claRepresentatives") ?? "[]"),
    );
  } catch {
    representatives = [];
  }

  return conventionPdfSettingsSchema.safeParse({
    claAssociationName: formData.get("claAssociationName"),
    claAddress: formData.get("claAddress"),
    claRepresentatives: representatives,
    claSignatoryName: formData.get("claSignatoryName"),
    claSignatoryRole: formData.get("claSignatoryRole"),
    claSignatureCity: formData.get("claSignatureCity"),
  });
}
