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

export const deleteExpenseReportFormSchema = z.object({
  id: z.string().uuid(),
  assoSlug: z.string().min(1),
});

export type DeleteExpenseReportFormInput = z.infer<
  typeof deleteExpenseReportFormSchema
>;

export function parseDeleteExpenseReportForm(formData: FormData) {
  return deleteExpenseReportFormSchema.safeParse({
    id: formData.get("id"),
    assoSlug: formData.get("assoSlug"),
  });
}

export const ibanSchema = z
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
export const nullableUuid = () =>
  z
    .string()
    .nullish()
    .transform((value) => (value && value.trim().length > 0 ? value : null))
    .refine(
      (value) => value === null || z.string().uuid().safeParse(value).success,
      { message: "Identifiant invalide." },
    );

export const expenseReportLineBaseSchema = z.object({
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

const expenseDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La date de la dépense est obligatoire.")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

/** L'identité du bénéficiaire est portée par la Note, jamais par la Ligne. */
export const reimbursementBaseSchema = expenseReportLineBaseSchema.extend({
  expenseDate: expenseDateSchema,
});

export const addReimbursementFormSchema = refineExpenseReportLine(
  reimbursementBaseSchema.extend({
    expenseReportId: z.string().uuid(),
    assoSlug: z.string().min(1),
  }),
);

export const updateReimbursementFormSchema = refineExpenseReportLine(
  reimbursementBaseSchema.extend({
    id: z.string().uuid(),
    assoSlug: z.string().min(1),
  }),
);

export function reimbursementFormValues(formData: FormData) {
  return {
    expenseDate: formData.get("expenseDate"),
    amount: formData.get("amount"),
    expenseName: formData.get("expenseName"),
    typeDepenseId: formData.get("typeDepenseId"),
    customLabel: formData.get("customLabel"),
    fundingSource: formData.get("fundingSource"),
    subventionId: formData.get("subventionId"),
  };
}

export function parseAddReimbursementForm(formData: FormData) {
  return addReimbursementFormSchema.safeParse({
    expenseReportId: formData.get("expenseReportId"),
    assoSlug: formData.get("assoSlug"),
    ...reimbursementFormValues(formData),
  });
}

export function parseUpdateReimbursementForm(formData: FormData) {
  return updateReimbursementFormSchema.safeParse({
    id: formData.get("id"),
    assoSlug: formData.get("assoSlug"),
    ...reimbursementFormValues(formData),
  });
}

export const updateExpenseReportBeneficiaryFormSchema = z
  .object({
    id: z.string().uuid(),
    assoSlug: z.string().min(1),
    beneficiaryKind: z.enum(["MEMBER", "CUSTOM"]),
    beneficiaryUserId: nullableUuid(),
    beneficiaryFirstname: z
      .string()
      .trim()
      .min(1, "Le prénom est obligatoire.")
      .max(100),
    beneficiaryLastname: z
      .string()
      .trim()
      .min(1, "Le nom est obligatoire.")
      .max(100),
    beneficiaryIban: z.union([ibanSchema, z.literal("")]),
  })
  .refine(
    (data) =>
      data.beneficiaryKind === "MEMBER"
        ? Boolean(data.beneficiaryUserId)
        : data.beneficiaryUserId === null,
    { message: "Choisissez un membre valide.", path: ["beneficiaryUserId"] },
  );

export function parseUpdateExpenseReportBeneficiaryForm(formData: FormData) {
  return updateExpenseReportBeneficiaryFormSchema.safeParse({
    id: formData.get("id"),
    assoSlug: formData.get("assoSlug"),
    beneficiaryKind: formData.get("beneficiaryKind"),
    beneficiaryUserId: formData.get("beneficiaryUserId"),
    beneficiaryFirstname: formData.get("beneficiaryFirstname"),
    beneficiaryLastname: formData.get("beneficiaryLastname"),
    beneficiaryIban: formData.get("beneficiaryIban"),
  });
}

type ExpenseReportFundingFields = {
  typeDepenseId: string | null;
  customLabel: string | null;
  fundingSource: "CLUB_BALANCE" | "SUBVENTION";
  subventionId: string | null;
};

export function refineExpenseReportLine<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .refine(
      (data) => {
        const funding = data as ExpenseReportFundingFields;
        return Boolean(funding.typeDepenseId) !== Boolean(funding.customLabel);
      },
      {
        message:
          "Choisissez un Type de dépense dans la liste, ou saisissez un libellé personnalisé, jamais les deux.",
        path: ["typeDepenseId"],
      },
    )
    .refine(
      (data) => {
        const funding = data as ExpenseReportFundingFields;
        return funding.fundingSource === "SUBVENTION"
          ? Boolean(funding.subventionId)
          : !funding.subventionId;
      },
      {
        message:
          "Une Subvention doit être choisie comme source, ou aucune si la source est le Solde.",
        path: ["subventionId"],
      },
    );
}
