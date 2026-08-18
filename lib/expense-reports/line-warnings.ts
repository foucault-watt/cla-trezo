import type {
  ExpenseReportStatus,
  FundingSourceType,
} from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { PENDING_EXPENSE_REPORT_STATUSES } from "./expense-report-lifecycle";

export type LineWarningCode =
  | "NEGATIVE_BALANCE"
  | "SUBVENTION_OVERAGE"
  | "STALE_SUBVENTION";

export const LINE_WARNING_MESSAGES: Record<LineWarningCode, string> = {
  NEGATIVE_BALANCE: "Cette Ligne crée ou aggrave un solde négatif.",
  SUBVENTION_OVERAGE:
    "Cette Ligne dépasse le montant restant de la Subvention.",
  STALE_SUBVENTION:
    "La Subvention utilisée date de plus d'un an ; elle sera probablement refusée.",
};

function subtractYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() - years);
  return result;
}

/**
 * Une Subvention est "ancienne" (Warning T15) quand sa Campagne date de plus
 * d'un an. Utilisé aussi bien pour flaguer une Ligne existante que pour
 * afficher une Subvention en rouge dans le panneau de sélection.
 */
export function isSubventionStale(campaignDate: Date, now: Date): boolean {
  return campaignDate < subtractYears(now, 1);
}

/**
 * Fenêtre au-delà de laquelle une Subvention disparaît complètement du
 * panneau de sélection lors de l'ajout d'une Ligne (au-delà d'un an et
 * jusqu'à deux ans, elle reste sélectionnable mais flaguée via
 * isSubventionStale). Ne s'applique qu'à ce panneau, pas à la page de
 * consultation dédiée des Subventions (T7), qui reste un historique complet.
 */
export function isSubventionWithinFundingWindow(
  campaignDate: Date,
  now: Date,
): boolean {
  return campaignDate >= subtractYears(now, 2);
}

/**
 * Règle T13 : le Solde projeté (confirmé moins les Lignes en attente de
 * Validation sur ce même Solde, moins cette Ligne) devient négatif.
 */
export function checkNegativeBalanceWarning(input: {
  confirmedBalanceCents: number;
  pendingOtherLinesCents: number;
  lineAmountCents: number;
}): boolean {
  return (
    input.confirmedBalanceCents -
      input.pendingOtherLinesCents -
      input.lineAmountCents <
    0
  );
}

/**
 * Règle T14 : cette Ligne dépasse le montant restant de la Subvention, une
 * fois retranchés la consommation déjà Validée et les autres Lignes en
 * attente sur cette même Subvention (jamais mélangées avec une autre).
 */
export function checkSubventionOverageWarning(input: {
  subventionTotalCents: number;
  confirmedUsedCents: number;
  pendingOtherLinesCents: number;
  lineAmountCents: number;
}): boolean {
  const remainingCents =
    input.subventionTotalCents -
    input.confirmedUsedCents -
    input.pendingOtherLinesCents;
  return input.lineAmountCents > remainingCents;
}

export type ComputeLineWarningsInput =
  | {
      fundingSource: Extract<FundingSourceType, "CLUB_BALANCE">;
      confirmedBalanceCents: number;
      pendingOtherLinesCents: number;
      lineAmountCents: number;
    }
  | {
      fundingSource: Extract<FundingSourceType, "SUBVENTION">;
      subventionTotalCents: number;
      confirmedUsedCents: number;
      pendingOtherLinesCents: number;
      lineAmountCents: number;
      campaignDate: Date;
      now: Date;
    };

/**
 * Combine les règles T13/T14/T15 pour une Ligne donnée. Fonction pure :
 * jamais bloquante (cf. domaine "Warning", CONTEXT.md), renvoie simplement la
 * liste des messages à afficher — vide si rien à signaler.
 */
export function computeLineWarnings(input: ComputeLineWarningsInput): string[] {
  if (input.fundingSource === "CLUB_BALANCE") {
    return checkNegativeBalanceWarning(input)
      ? [LINE_WARNING_MESSAGES.NEGATIVE_BALANCE]
      : [];
  }

  const warnings: string[] = [];
  if (checkSubventionOverageWarning(input)) {
    warnings.push(LINE_WARNING_MESSAGES.SUBVENTION_OVERAGE);
  }
  if (isSubventionStale(input.campaignDate, input.now)) {
    warnings.push(LINE_WARNING_MESSAGES.STALE_SUBVENTION);
  }
  return warnings;
}

export type FundingSourceWarningTotals =
  | {
      fundingSource: Extract<FundingSourceType, "CLUB_BALANCE">;
      confirmedBalanceCents: number;
      pendingLinesCentsTotal: number;
    }
  | {
      fundingSource: Extract<FundingSourceType, "SUBVENTION">;
      subventionTotalCents: number;
      confirmedUsedCents: number;
      pendingLinesCentsTotal: number;
      campaignDate: Date;
    };

/**
 * Charge les totaux Prisma nécessaires au calcul des Warnings pour une
 * source de financement exacte (le Solde d'une Structure, ou une Subvention
 * précise — jamais mélangées entre elles) : le confirmé (FinancialMovement,
 * mouvements Validés uniquement) et la somme des Lignes en attente de
 * Validation sur cette même source (cf. PENDING_EXPENSE_REPORT_STATUSES).
 * `excludeLineId` retire une Ligne précise de cette somme (édition d'une
 * Ligne déjà en base) ; pour un usage groupé sur plusieurs Lignes (lecture
 * seule), omettre `excludeLineId` et retrancher `lineAmountCents` de
 * `pendingLinesCentsTotal` au site d'appel.
 */
export async function loadFundingSourceWarningTotals({
  assoId,
  fundingSource,
  subventionId,
  excludeLineId,
}: {
  assoId: string;
  fundingSource: FundingSourceType;
  subventionId: string | null;
  excludeLineId?: string;
}): Promise<FundingSourceWarningTotals | null> {
  if (fundingSource === "CLUB_BALANCE") {
    const [movements, pendingLines] = await Promise.all([
      prisma.financialMovement.findMany({
        where: { assoId, accountType: "CLUB_BALANCE" },
        select: { movementType: true, amountCents: true },
      }),
      prisma.expenseReportLine.findMany({
        where: {
          fundingSource: "CLUB_BALANCE",
          ...(excludeLineId && { id: { not: excludeLineId } }),
          expenseReport: {
            assoId,
            status: { in: PENDING_EXPENSE_REPORT_STATUSES },
          },
        },
        select: { amountCents: true },
      }),
    ]);

    const confirmedBalanceCents = movements.reduce(
      (sum, m) =>
        sum + (m.movementType === "CREDIT" ? m.amountCents : -m.amountCents),
      0,
    );
    const pendingLinesCentsTotal = pendingLines.reduce(
      (sum, l) => sum + l.amountCents,
      0,
    );

    return { fundingSource, confirmedBalanceCents, pendingLinesCentsTotal };
  }

  if (!subventionId) return null;

  const [subvention, movements, pendingLines] = await Promise.all([
    prisma.subvention.findUnique({
      where: { id: subventionId },
      select: { amountCents: true, campaign: { select: { date: true } } },
    }),
    prisma.financialMovement.findMany({
      where: { subventionId, accountType: "SUBVENTION" },
      select: { movementType: true, amountCents: true },
    }),
    prisma.expenseReportLine.findMany({
      where: {
        subventionId,
        ...(excludeLineId && { id: { not: excludeLineId } }),
        expenseReport: { status: { in: PENDING_EXPENSE_REPORT_STATUSES } },
      },
      select: { amountCents: true },
    }),
  ]);

  if (!subvention) return null;

  const confirmedUsedCents = movements.reduce(
    (sum, m) =>
      sum + (m.movementType === "DEBIT" ? m.amountCents : -m.amountCents),
    0,
  );
  const pendingLinesCentsTotal = pendingLines.reduce(
    (sum, l) => sum + l.amountCents,
    0,
  );

  return {
    fundingSource,
    subventionTotalCents: subvention.amountCents,
    confirmedUsedCents,
    pendingLinesCentsTotal,
    campaignDate: subvention.campaign.date,
  };
}

/**
 * Dérive les Warnings d'une Ligne à partir de totaux déjà chargés (cf.
 * loadFundingSourceWarningTotals), en factorisant le dispatch CLUB_BALANCE/
 * SUBVENTION partagé par le calcul mono-Ligne (Server Action) et le calcul
 * groupé (lecture seule, cf. loadLineWarningsByLineId).
 */
function computeWarningsFromTotals(
  totals: FundingSourceWarningTotals,
  lineAmountCents: number,
  pendingOtherLinesCents: number,
  now: Date,
): string[] {
  if (totals.fundingSource === "CLUB_BALANCE") {
    return computeLineWarnings({
      fundingSource: "CLUB_BALANCE",
      confirmedBalanceCents: totals.confirmedBalanceCents,
      pendingOtherLinesCents,
      lineAmountCents,
    });
  }

  return computeLineWarnings({
    fundingSource: "SUBVENTION",
    subventionTotalCents: totals.subventionTotalCents,
    confirmedUsedCents: totals.confirmedUsedCents,
    pendingOtherLinesCents,
    lineAmountCents,
    campaignDate: totals.campaignDate,
    now,
  });
}

/**
 * Charge puis calcule les Warnings d'une Ligne unique en cours d'ajout ou de
 * modification (Server Action). `excludeLineId` retire la Ligne éditée de
 * ses propres cumuls (cf. loadFundingSourceWarningTotals) ; un échec
 * silencieux (Subvention introuvable entre-temps) renvoie aucun Warning
 * plutôt que de faire échouer l'action, qui a déjà passé la règle
 * d'éligibilité T11 à ce stade.
 */
export async function loadExpenseLineWarnings({
  assoId,
  fundingSource,
  subventionId,
  lineAmountCents,
  excludeLineId,
}: {
  assoId: string;
  fundingSource: FundingSourceType;
  subventionId: string | null;
  lineAmountCents: number;
  excludeLineId?: string;
}): Promise<string[]> {
  const totals = await loadFundingSourceWarningTotals({
    assoId,
    fundingSource,
    subventionId,
    excludeLineId,
  });
  if (!totals) return [];
  return computeWarningsFromTotals(
    totals,
    lineAmountCents,
    totals.pendingLinesCentsTotal,
    new Date(),
  );
}

/**
 * Calcule les Warnings de chaque Ligne d'une Note (lecture seule, Structure
 * ou Admin) : une requête par source de financement distincte utilisée
 * parmi les Lignes (le Solde une fois, chaque Subvention une fois), jamais
 * une par Ligne.
 */
export async function loadLineWarningsByLineId(
  assoId: string,
  lines: {
    id: string;
    fundingSource: FundingSourceType;
    subventionId: string | null;
    amountCents: number;
  }[],
): Promise<Map<string, string[]>> {
  const now = new Date();
  const result = new Map<string, string[]>();

  const usesClubBalance = lines.some(
    (l) => l.fundingSource === "CLUB_BALANCE",
  );
  const subventionIds = [
    ...new Set(
      lines
        .filter((l) => l.fundingSource === "SUBVENTION" && l.subventionId)
        .map((l) => l.subventionId as string),
    ),
  ];

  const [clubBalanceTotals, subventionTotalsEntries] = await Promise.all([
    usesClubBalance
      ? loadFundingSourceWarningTotals({
          assoId,
          fundingSource: "CLUB_BALANCE",
          subventionId: null,
        })
      : Promise.resolve(null),
    Promise.all(
      subventionIds.map(
        async (subventionId) =>
          [
            subventionId,
            await loadFundingSourceWarningTotals({
              assoId,
              fundingSource: "SUBVENTION",
              subventionId,
            }),
          ] as const,
      ),
    ),
  ]);
  const subventionTotalsById = new Map(subventionTotalsEntries);

  for (const line of lines) {
    const totals =
      line.fundingSource === "CLUB_BALANCE"
        ? clubBalanceTotals
        : line.subventionId
          ? subventionTotalsById.get(line.subventionId)
          : null;
    if (!totals || totals.fundingSource !== line.fundingSource) continue;

    result.set(
      line.id,
      computeWarningsFromTotals(
        totals,
        line.amountCents,
        totals.pendingLinesCentsTotal - line.amountCents,
        now,
      ),
    );
  }

  return result;
}

/**
 * Attache à chaque Ligne d'une Note ses Warnings T13-T15, recalculés à la
 * volée (jamais stockés). Sans objet pour une Note déjà Validée ou Rejetée
 * (cf. PENDING_EXPENSE_REPORT_STATUSES) : l'argent a déjà bougé ou ne
 * bougera plus, il n'y a plus rien à signaler. Partagé par la lecture
 * Structure et la lecture Admin (cf. lib/expense-reports/expense-reports.ts
 * et lib/admin/expense-reports.ts).
 */
export async function attachLineWarnings<
  T extends {
    id: string;
    fundingSource: FundingSourceType;
    subventionId: string | null;
    amountCents: number;
    warnings: string[];
  },
>(assoId: string, status: ExpenseReportStatus, lines: T[]): Promise<T[]> {
  const warningsByLineId = PENDING_EXPENSE_REPORT_STATUSES.includes(status)
    ? await loadLineWarningsByLineId(assoId, lines)
    : new Map<string, string[]>();

  return lines.map((line) => ({
    ...line,
    warnings: warningsByLineId.get(line.id) ?? [],
  }));
}
