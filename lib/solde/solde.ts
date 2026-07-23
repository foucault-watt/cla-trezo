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

  if (assoType !== "CLUB") {
    return { status: "not_applicable" };
  }

  const isInitialized = movements.some((m) => m.origin === "MANUAL");
  if (!isInitialized) {
    return { status: "not_initialized" };
  }

  const balanceCents = movements.reduce(
    (sum, m) =>
      sum + (m.movementType === "CREDIT" ? m.amountCents : -m.amountCents),
    0,
  );
  const sortedMovements = [...movements].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return { status: "ready", balanceCents, movements: sortedMovements };
}
