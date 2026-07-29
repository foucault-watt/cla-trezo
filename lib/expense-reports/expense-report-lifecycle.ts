import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";

export type ExpenseReportActor =
  | { type: "STRUCTURE"; assoId: string }
  | { type: "ADMIN" };

/**
 * Erreur unique pour toute transition illégale ou action non autorisée par
 * un acteur — un site d'appel se contente de laisser remonter l'erreur, sans
 * réécrire de condition (cf. issue #27).
 */
export class ExpenseReportLifecycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpenseReportLifecycleError";
  }
}

const ALLOWED_TRANSITIONS: {
  from: ExpenseReportStatus;
  to: ExpenseReportStatus;
  actor: ExpenseReportActor["type"];
}[] = [
  { from: "DRAFT", to: "SUBMITTED", actor: "STRUCTURE" },
  { from: "SUBMITTED", to: "TAKEN_OVER", actor: "ADMIN" },
  { from: "TAKEN_OVER", to: "FINALIZED", actor: "ADMIN" },
  { from: "TAKEN_OVER", to: "REJECTED", actor: "ADMIN" },
];

/**
 * Vérifie qu'une transition de statut est légale et que l'acteur a le droit
 * de la déclencher. Lève ExpenseReportLifecycleError sinon.
 */
export function assertExpenseReportTransition({
  from,
  to,
  actor,
}: {
  from: ExpenseReportStatus;
  to: ExpenseReportStatus;
  actor: ExpenseReportActor;
}): void {
  const allowed = ALLOWED_TRANSITIONS.find(
    (transition) => transition.from === from && transition.to === to,
  );
  if (!allowed) {
    throw new ExpenseReportLifecycleError(
      `Transition illégale : ${from} → ${to}.`,
    );
  }
  if (allowed.actor !== actor.type) {
    throw new ExpenseReportLifecycleError(
      `L'acteur ${actor.type} ne peut pas déclencher la transition ${from} → ${to}.`,
    );
  }
}

const MUTABLE_STATUSES: ExpenseReportStatus[] = ["DRAFT", "SUBMITTED"];

/**
 * Vérifie qu'une Ligne ou un Justificatif peut être ajouté/modifié dans le
 * statut courant, par cet acteur. Seule la Structure modifie le contenu, et
 * seulement tant que l'Admin n'a pas pris la note en charge (cf. ADR-0001).
 */
export function assertExpenseReportMutable({
  status,
  actor,
}: {
  status: ExpenseReportStatus;
  actor: ExpenseReportActor;
}): void {
  if (actor.type !== "STRUCTURE" || !MUTABLE_STATUSES.includes(status)) {
    throw new ExpenseReportLifecycleError(
      `Cette Note de frais n'est plus modifiable (statut ${status}).`,
    );
  }
}
