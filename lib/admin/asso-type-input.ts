import { z } from "zod";

export const setAssoTypeFormSchema = z.object({
  assoId: z.string().uuid(),
  assoSlug: z.string().min(1),
  type: z.enum(["CLUB", "COMMISSION", "ASSOCIATION_1901"]),
});

export type SetAssoTypeFormInput = z.infer<typeof setAssoTypeFormSchema>;

export function parseSetAssoTypeForm(formData: FormData) {
  return setAssoTypeFormSchema.safeParse({
    assoId: formData.get("assoId"),
    assoSlug: formData.get("assoSlug"),
    type: formData.get("type"),
  });
}
