import { z } from "zod";

// Même plafond que le libellé personnalisé d'un Remboursement
// (expense-report-input.ts), pour qu'un libellé personnalisé puisse
// toujours devenir un Type de dépense tel quel.
const labelSchema = z
  .string()
  .trim()
  .min(1, "Le libellé est obligatoire.")
  .max(100, "Le libellé ne doit pas dépasser 100 caractères.")
  .transform((value) => value.replace(/\s+/g, " "));

export const typeDepenseCreateFormSchema = z.object({
  label: labelSchema,
});

export function parseTypeDepenseCreateForm(formData: FormData) {
  return typeDepenseCreateFormSchema.safeParse({
    label: formData.get("label"),
  });
}

export const typeDepenseUpdateFormSchema = z.object({
  id: z.string().uuid(),
  label: labelSchema,
});

export function parseTypeDepenseUpdateForm(formData: FormData) {
  return typeDepenseUpdateFormSchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
  });
}

export const typeDepenseDeleteFormSchema = z.object({
  id: z.string().uuid(),
  replacementTypeDepenseId: z
    .string()
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null))
    .refine(
      (value) => value === null || z.string().uuid().safeParse(value).success,
      { message: "Type de remplacement invalide." },
    ),
});

export function parseTypeDepenseDeleteForm(formData: FormData) {
  return typeDepenseDeleteFormSchema.safeParse({
    id: formData.get("id"),
    replacementTypeDepenseId: formData.get("replacementTypeDepenseId"),
  });
}

/**
 * Reclassement d'un libellé personnalisé : soit un nouveau nom (qui reste
 * personnalisé), soit un Type de dépense existant imposé à la place.
 */
export const customLabelReclassFormSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("RENAME"),
    // Libellé actuel tel que stocké : pas de trim, il doit matcher exactement.
    customLabel: z.string().min(1),
    newLabel: labelSchema,
  }),
  z.object({
    mode: z.literal("TYPE"),
    customLabel: z.string().min(1),
    typeDepenseId: z.string().uuid("Choisissez un Type de dépense."),
  }),
]);

export type CustomLabelReclassInput = z.infer<
  typeof customLabelReclassFormSchema
>;

export function parseCustomLabelReclassForm(formData: FormData) {
  const mode = formData.get("mode");
  return customLabelReclassFormSchema.safeParse(
    mode === "TYPE"
      ? {
          mode,
          customLabel: formData.get("customLabel"),
          typeDepenseId: formData.get("typeDepenseId"),
        }
      : {
          mode,
          customLabel: formData.get("customLabel"),
          newLabel: formData.get("newLabel"),
        },
  );
}
