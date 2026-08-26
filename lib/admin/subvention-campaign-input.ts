import { z } from "zod";

/**
 * publicationDate est facultative à la création : une campagne sans date de
 * publication reste Programmée indéfiniment (cf. lib/subventions/status.ts),
 * l'Admin peut la publier plus tard.
 */
export const subventionCampaignFormSchema = z.object({
  type: z.enum(["CA_BUDGET", "CA_EVENT", "CA_EXCEPTIONNEL"]),
  name: z.string().trim().min(1, "Le nom est obligatoire.").max(200),
  date: z.coerce.date({ error: "Date invalide." }),
  publicationDate: z
    .string()
    .nullish()
    .transform((value) => (value ?? "").trim())
    .pipe(
      z
        .string()
        .refine(
          (value) => value === "" || !Number.isNaN(Date.parse(value)),
          "Date de publication invalide.",
        ),
    )
    .transform((value) => (value === "" ? null : new Date(value))),
});

export type SubventionCampaignFormInput = z.infer<
  typeof subventionCampaignFormSchema
>;

export function parseSubventionCampaignForm(formData: FormData) {
  return subventionCampaignFormSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    date: formData.get("date"),
    publicationDate: formData.get("publicationDate"),
  });
}

export const subventionCampaignUpdateFormSchema =
  subventionCampaignFormSchema.extend({
    campaignId: z.string().uuid(),
  });

export type SubventionCampaignUpdateFormInput = z.infer<
  typeof subventionCampaignUpdateFormSchema
>;

export function parseSubventionCampaignUpdateForm(formData: FormData) {
  return subventionCampaignUpdateFormSchema.safeParse({
    campaignId: formData.get("campaignId"),
    type: formData.get("type"),
    name: formData.get("name"),
    date: formData.get("date"),
    publicationDate: formData.get("publicationDate"),
  });
}

export const subventionCampaignDeleteFormSchema = z.object({
  id: z.string().uuid(),
});

export type SubventionCampaignDeleteFormInput = z.infer<
  typeof subventionCampaignDeleteFormSchema
>;

export function parseSubventionCampaignDeleteForm(formData: FormData) {
  return subventionCampaignDeleteFormSchema.safeParse({
    id: formData.get("id"),
  });
}
