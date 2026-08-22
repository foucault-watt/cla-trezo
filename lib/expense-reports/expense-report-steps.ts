export const EXPENSE_REPORT_STEPS = ["remboursements", "beneficiaire"] as const;

export type ExpenseReportStep = (typeof EXPENSE_REPORT_STEPS)[number];

export type ExpenseReportStepCompletion = Record<ExpenseReportStep, boolean>;

export const EXPENSE_REPORT_STEP_LABELS: Record<ExpenseReportStep, string> = {
  remboursements: "Dépenses & justificatifs",
  beneficiaire: "Bénéficiaire & envoi",
};

export function expenseReportStepHref(
  assoSlug: string,
  reportId: string,
  step: ExpenseReportStep,
) {
  return `/app/${assoSlug}/notes-de-frais/${reportId}/${step}`;
}

export function expenseReportSummaryHref(assoSlug: string, reportId: string) {
  return `/app/${assoSlug}/notes-de-frais/${reportId}/recapitulatif`;
}

export function firstIncompleteExpenseReportStep(
  completion: ExpenseReportStepCompletion,
): ExpenseReportStep {
  return (
    EXPENSE_REPORT_STEPS.find((step) => !completion[step]) ?? "beneficiaire"
  );
}
