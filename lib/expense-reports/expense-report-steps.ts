export const EXPENSE_REPORT_STEPS = [
  "remboursements",
  "justificatifs",
  "beneficiaire",
  "recapitulatif",
] as const;

export type ExpenseReportStep = (typeof EXPENSE_REPORT_STEPS)[number];

export type ExpenseReportStepCompletion = Record<ExpenseReportStep, boolean>;

export const EXPENSE_REPORT_STEP_LABELS: Record<ExpenseReportStep, string> = {
  remboursements: "Remboursements",
  justificatifs: "Justificatifs",
  beneficiaire: "Bénéficiaire",
  recapitulatif: "Récapitulatif",
};

export function expenseReportStepHref(
  assoSlug: string,
  reportId: string,
  step: ExpenseReportStep,
) {
  return `/app/${assoSlug}/notes-de-frais/${reportId}/${step}`;
}

export function firstIncompleteExpenseReportStep(
  completion: ExpenseReportStepCompletion,
): ExpenseReportStep {
  return (
    EXPENSE_REPORT_STEPS.find(
      (step) => step !== "recapitulatif" && !completion[step],
    ) ?? "recapitulatif"
  );
}
