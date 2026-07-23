import { z } from "zod";

export const manualMovementFormSchema = z.object({
  assoId: z.string().uuid(),
  assoSlug: z.string().min(1),
  movementType: z.enum(["CREDIT", "DEBIT"]),
  amount: z.coerce.number().positive("Le montant doit être positif."),
  description: z
    .string()
    .trim()
    .min(1, "La description est obligatoire.")
    .max(200),
  date: z.coerce.date({ error: "Date invalide." }),
});

export type ManualMovementFormInput = z.infer<typeof manualMovementFormSchema>;

export function parseManualMovementForm(formData: FormData) {
  return manualMovementFormSchema.safeParse({
    assoId: formData.get("assoId"),
    assoSlug: formData.get("assoSlug"),
    movementType: formData.get("movementType"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    date: formData.get("date"),
  });
}

export function toAmountCents(amount: number): number {
  return Math.round(amount * 100);
}
