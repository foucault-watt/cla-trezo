import { z } from "zod";

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
