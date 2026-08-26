import type { FundingSourceType } from "@/app/generated/prisma/enums";

export type ExpenseReportLineForGrouping = {
  id: string;
  amountCents: number;
  fundingSource: FundingSourceType;
  subventionId: string | null;
};

export type SubventionFundingGroup<
  Line extends ExpenseReportLineForGrouping = ExpenseReportLineForGrouping,
> = {
  kind: "SUBVENTION";
  subventionId: string;
  lines: Line[];
};

export type ClubBalanceFundingGroup<
  Line extends ExpenseReportLineForGrouping = ExpenseReportLineForGrouping,
> = {
  kind: "CLUB_BALANCE";
  lines: Line[];
};

export type ExpenseReportFundingGroup<
  Line extends ExpenseReportLineForGrouping = ExpenseReportLineForGrouping,
> = SubventionFundingGroup<Line> | ClubBalanceFundingGroup<Line>;

export const CLUB_BALANCE_FUNDING_GROUP_KEY = "CLUB_BALANCE";

/**
 * Identifiant stable d'un groupe (Subvention ou Solde), partagé par la
 * préparation de l'aperçu (expense-report-validation-preparation.ts) et la
 * Server Action de validation (validate-expense-report-action.ts) pour
 * qu'un document envoyé par le client soit rattaché sans ambiguïté au bon
 * groupe recalculé côté serveur.
 */
export function fundingGroupKey(
  group:
    | { kind: "SUBVENTION"; subventionId: string }
    | { kind: "CLUB_BALANCE" },
): string {
  return group.kind === "SUBVENTION"
    ? group.subventionId
    : CLUB_BALANCE_FUNDING_GROUP_KEY;
}

/**
 * Regroupe les Lignes d'une Note par source de financement, en vue de la
 * génération d'un PDF final par source distincte (ADR-0006) : un groupe par
 * Subvention référencée par au moins une Ligne, plus un groupe Solde s'il en
 * existe au moins une. Pure, sans accès DB — testable isolément. Générique
 * sur le type de Ligne pour laisser les appelants sélectionner des champs
 * Prisma supplémentaires (expenseDate, expenseName...) sans les perdre.
 */
export function groupExpenseReportLinesByFundingSource<
  Line extends ExpenseReportLineForGrouping,
>(lines: Line[]): ExpenseReportFundingGroup<Line>[] {
  const subventionLinesById = new Map<string, Line[]>();
  const clubBalanceLines: Line[] = [];

  for (const line of lines) {
    if (line.fundingSource === "CLUB_BALANCE") {
      clubBalanceLines.push(line);
      continue;
    }

    // Invariant garanti en amont (loadFundingSourceEligibility) : une Ligne
    // financée par une Subvention référence toujours cette Subvention.
    const subventionId = line.subventionId as string;
    const existing = subventionLinesById.get(subventionId);
    if (existing) {
      existing.push(line);
    } else {
      subventionLinesById.set(subventionId, [line]);
    }
  }

  const groups: ExpenseReportFundingGroup<Line>[] = Array.from(
    subventionLinesById.entries(),
  ).map(([subventionId, subventionLines]) => ({
    kind: "SUBVENTION" as const,
    subventionId,
    lines: subventionLines,
  }));

  if (clubBalanceLines.length > 0) {
    groups.push({ kind: "CLUB_BALANCE", lines: clubBalanceLines });
  }

  return groups;
}
