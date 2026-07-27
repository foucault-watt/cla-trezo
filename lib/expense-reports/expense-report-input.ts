import { z } from "zod";

export const createExpenseReportFormSchema = z.object({
  assoSlug: z.string().min(1),
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type CreateExpenseReportFormInput = z.infer<
  typeof createExpenseReportFormSchema
>;

export function parseCreateExpenseReportForm(formData: FormData) {
  return createExpenseReportFormSchema.safeParse({
    assoSlug: formData.get("assoSlug"),
    title: formData.get("title"),
    description: formData.get("description"),
  });
}

export const updateExpenseReportFormSchema = z.object({
  id: z.string().uuid(),
  assoSlug: z.string().min(1),
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(200),
  description: z
    .string()
    .trim()
    .max(2000)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type UpdateExpenseReportFormInput = z.infer<
  typeof updateExpenseReportFormSchema
>;

export function parseUpdateExpenseReportForm(formData: FormData) {
  return updateExpenseReportFormSchema.safeParse({
    id: formData.get("id"),
    assoSlug: formData.get("assoSlug"),
    title: formData.get("title"),
    description: formData.get("description"),
  });
}

const ibanSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, "").toUpperCase())
  .pipe(
    z
      .string()
      .regex(
        /^[A-Z0-9]{15,34}$/,
        "IBAN invalide (15 à 34 caractères alphanumériques, espaces ignorés).",
      ),
  );

// Un champ optionnel qui référence un uuid arrive du formulaire soit absent
// (input non rendu -> null/undefined), soit vide (select resté sur son
// option placeholder) : les deux doivent être traités comme "non fourni",
// avant seulement de valider le format uuid si une valeur est présente.
const nullableUuid = () =>
  z
    .string()
    .nullish()
    .transform((value) => (value && value.trim().length > 0 ? value : null))
    .refine(
      (value) => value === null || z.string().uuid().safeParse(value).success,
      { message: "Identifiant invalide." },
    );

const expenseReportLineBaseSchema = z.object({
  beneficiaryFirstname: z
    .string()
    .trim()
    .min(1, "Le prénom du bénéficiaire est obligatoire.")
    .max(100),
  beneficiaryLastname: z
    .string()
    .trim()
    .min(1, "Le nom du bénéficiaire est obligatoire.")
    .max(100),
  iban: ibanSchema,
  amount: z.coerce.number().positive("Le montant doit être positif."),
  expenseName: z
    .string()
    .trim()
    .min(1, "Le nom de la dépense est obligatoire.")
    .max(200),
  typeDepenseId: nullableUuid(),
  customLabel: z
    .string()
    .trim()
    .max(100)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null)),
  fundingSource: z.enum(["CLUB_BALANCE", "SUBVENTION"]),
  subventionId: nullableUuid(),
});

function refineExpenseReportLine<T extends z.infer<typeof expenseReportLineBaseSchema>>(
  schema: z.ZodType<T>,
) {
  return schema
    .refine((data) => Boolean(data.typeDepenseId) !== Boolean(data.customLabel), {
      message:
        "Choisissez un Type de dépense dans la liste, ou saisissez un libellé personnalisé, jamais les deux.",
      path: ["typeDepenseId"],
    })
    .refine(
      (data) =>
        data.fundingSource === "SUBVENTION"
          ? Boolean(data.subventionId)
          : !data.subventionId,
      {
        message:
          "Une Subvention doit être choisie comme source, ou aucune si la source est le Solde.",
        path: ["subventionId"],
      },
    );
}

export const addExpenseReportLineFormSchema = refineExpenseReportLine(
  expenseReportLineBaseSchema.extend({
    expenseReportId: z.string().uuid(),
    assoSlug: z.string().min(1),
  }),
);

export type AddExpenseReportLineFormInput = z.infer<
  typeof addExpenseReportLineFormSchema
>;

export function parseAddExpenseReportLineForm(formData: FormData) {
  return addExpenseReportLineFormSchema.safeParse({
    expenseReportId: formData.get("expenseReportId"),
    assoSlug: formData.get("assoSlug"),
    beneficiaryFirstname: formData.get("beneficiaryFirstname"),
    beneficiaryLastname: formData.get("beneficiaryLastname"),
    iban: formData.get("iban"),
    amount: formData.get("amount"),
    expenseName: formData.get("expenseName"),
    typeDepenseId: formData.get("typeDepenseId"),
    customLabel: formData.get("customLabel"),
    fundingSource: formData.get("fundingSource"),
    subventionId: formData.get("subventionId"),
  });
}

export const updateExpenseReportLineFormSchema = refineExpenseReportLine(
  expenseReportLineBaseSchema.extend({
    id: z.string().uuid(),
    assoSlug: z.string().min(1),
  }),
);

export type UpdateExpenseReportLineFormInput = z.infer<
  typeof updateExpenseReportLineFormSchema
>;

export function parseUpdateExpenseReportLineForm(formData: FormData) {
  return updateExpenseReportLineFormSchema.safeParse({
    id: formData.get("id"),
    assoSlug: formData.get("assoSlug"),
    beneficiaryFirstname: formData.get("beneficiaryFirstname"),
    beneficiaryLastname: formData.get("beneficiaryLastname"),
    iban: formData.get("iban"),
    amount: formData.get("amount"),
    expenseName: formData.get("expenseName"),
    typeDepenseId: formData.get("typeDepenseId"),
    customLabel: formData.get("customLabel"),
    fundingSource: formData.get("fundingSource"),
    subventionId: formData.get("subventionId"),
  });
}
