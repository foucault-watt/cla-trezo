import { z } from "zod";

export const subventionFormSchema = z.object({
  campaignId: z.string().uuid(),
  assoId: z.string().uuid(),
  reason: z.string().trim().min(1, "La raison est obligatoire.").max(200),
  amount: z.coerce.number().positive("Le montant doit être positif."),
  commentary: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type SubventionFormInput = z.infer<typeof subventionFormSchema>;

export function parseSubventionForm(formData: FormData) {
  return subventionFormSchema.safeParse({
    campaignId: formData.get("campaignId"),
    assoId: formData.get("assoId"),
    reason: formData.get("reason"),
    amount: formData.get("amount"),
    commentary: formData.get("commentary"),
  });
}

export const subventionUpdateFormSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().uuid(),
  reason: z.string().trim().min(1, "La raison est obligatoire.").max(200),
  amount: z.coerce.number().positive("Le montant doit être positif."),
  commentary: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type SubventionUpdateFormInput = z.infer<
  typeof subventionUpdateFormSchema
>;

export function parseSubventionUpdateForm(formData: FormData) {
  return subventionUpdateFormSchema.safeParse({
    id: formData.get("id"),
    campaignId: formData.get("campaignId"),
    reason: formData.get("reason"),
    amount: formData.get("amount"),
    commentary: formData.get("commentary"),
  });
}
