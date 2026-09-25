import type {
  AssoType,
  FinancialMovementOrigin,
  FinancialMovementType,
} from "@/app/generated/prisma/enums";

export type SoldeMovement = {
  id: string;
  movementType: FinancialMovementType;
  amountCents: number;
  origin: FinancialMovementOrigin;
  category: string | null;
  description: string | null;
  createdAt: Date;
};

/**
 * Champs d'un Mouvement de solde à charger pour afficher un Solde (select
 * Prisma partagé par toutes les lectures du Solde d'un Club).
 */
export const soldeMovementSelect = {
  id: true,
  movementType: true,
  amountCents: true,
  origin: true,
  category: true,
  description: true,
  createdAt: true,
} as const;

type SignedMovement = {
  movementType: FinancialMovementType;
  amountCents: number;
};

/** Seul un Club a un Solde (cf. CONTEXT.md) ; Commission et Association loi 1901 n'ont que des Subventions. */
export function assoHasSolde(assoType: AssoType | null): boolean {
  return assoType === "CLUB";
}

/**
 * Solde d'un Club : Entrées (CREDIT) moins Sorties (DEBIT). Toujours calculé
 * à la lecture, jamais stocké (ADR-0005). Peut être négatif : c'est un
 * Warning, jamais un blocage.
 */
export function balanceCents(movements: SignedMovement[]): number {
  return movements.reduce(
    (sum, m) =>
      sum + (m.movementType === "CREDIT" ? m.amountCents : -m.amountCents),
    0,
  );
}

/**
 * Montant utilisé d'une Subvention : les Remboursements Validés (DEBIT) moins
 * les éventuelles corrections (CREDIT) — convention inverse du Solde. Le
 * montant restant (total − utilisé) reste une valeur calculée, pas un statut.
 */
export function subventionUsedCents(movements: SignedMovement[]): number {
  return movements.reduce(
    (sum, m) =>
      sum + (m.movementType === "DEBIT" ? m.amountCents : -m.amountCents),
    0,
  );
}

/** subventionUsedCents pour plusieurs Subventions à la fois, indexé par Subvention. */
export function subventionUsedCentsById(
  movements: (SignedMovement & { subventionId: string | null })[],
): Map<string, number> {
  const bySubvention = new Map<string, SignedMovement[]>();
  for (const movement of movements) {
    if (!movement.subventionId) continue;
    const list = bySubvention.get(movement.subventionId) ?? [];
    list.push(movement);
    bySubvention.set(movement.subventionId, list);
  }
  return new Map(
    [...bySubvention].map(([id, list]) => [id, subventionUsedCents(list)]),
  );
}

export type SoldeView =
  | { status: "type_undefined" }
  | { status: "not_applicable" }
  | { status: "not_initialized" }
  | { status: "ready"; balanceCents: number; movements: SoldeMovement[] };

/**
 * Un Club n'a de Solde visible qu'après une première Entrée manuelle de
 * l'Admin (origin MANUAL) : tant qu'aucune n'existe, le solde n'est pas
 * considéré comme initialisé, même si des mouvements EXPENSE_REPORT
 * existaient déjà. Une Structure dont le Type n'a pas encore été classifié
 * par un Admin (cf. lib/admin/asso-type.ts) n'a pas non plus de Solde tant
 * que ce choix n'est pas fait, même si elle deviendra un Club ensuite.
 */
export function computeSolde(
  assoType: AssoType | null,
  movements: SoldeMovement[],
): SoldeView {
  if (assoType === null) {
    return { status: "type_undefined" };
  }

  if (!assoHasSolde(assoType)) {
    return { status: "not_applicable" };
  }

  const isInitialized = movements.some((m) => m.origin === "MANUAL");
  if (!isInitialized) {
    return { status: "not_initialized" };
  }

  const sortedMovements = [...movements].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return {
    status: "ready",
    balanceCents: balanceCents(movements),
    movements: sortedMovements,
  };
}
