import type { SubventionType } from "@/app/generated/prisma/enums";

export const subventionTypeLabel: Record<SubventionType, string> = {
  CA_BUDGET: "CA Budget",
  CA_EVENT: "CA Event",
  CA_EXCEPTIONNEL: "CA Exceptionnel",
};

export const subventionTypeOptions: { value: SubventionType; label: string }[] =
  (Object.keys(subventionTypeLabel) as SubventionType[]).map((value) => ({
    value,
    label: subventionTypeLabel[value],
  }));
