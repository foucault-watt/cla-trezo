import { redirect } from "next/navigation";
import { getExpenseReportDetail } from "./expense-reports";
import {
  EXPENSE_REPORT_STEPS,
  expenseReportStepHref,
  firstIncompleteExpenseReportStep,
  type ExpenseReportStep,
  type ExpenseReportStepCompletion,
} from "./expense-report-steps";

export * from "./expense-report-steps";

export function computeExpenseReportStepCompletion(report: {
  lines: { expenseDate?: Date | null }[];
  supportingDocuments: unknown[];
  beneficiaryFirstname: string | null;
  beneficiaryLastname: string | null;
  beneficiaryIbanLast4: string | null;
}): ExpenseReportStepCompletion {
  const reimbursements =
    report.lines.length > 0 && report.lines.every((line) => line.expenseDate);
  const supportingDocuments = report.supportingDocuments.length > 0;
  const beneficiary = Boolean(
    report.beneficiaryFirstname &&
    report.beneficiaryLastname &&
    report.beneficiaryIbanLast4,
  );
  return {
    remboursements: reimbursements,
    justificatifs: supportingDocuments,
    beneficiaire: beneficiary,
    recapitulatif: reimbursements && supportingDocuments && beneficiary,
  };
}

export async function loadExpenseReportWizard(
  assoSlug: string,
  reportId: string,
) {
  const context = await getExpenseReportDetail(assoSlug, reportId);
  const completion = computeExpenseReportStepCompletion(context.report);
  const legacyBeneficiaries = new Set(
    context.report.lines
      .filter((line) => line.beneficiaryFirstname && line.beneficiaryLastname)
      .map(
        (line) =>
          `${line.beneficiaryFirstname.trim().toLocaleLowerCase("fr-FR")}|${line.beneficiaryLastname.trim().toLocaleLowerCase("fr-FR")}`,
      ),
  );
  return {
    ...context,
    completion,
    editable:
      context.report.status === "DRAFT" ||
      context.report.status === "SUBMITTED",
    legacyMultiBeneficiary:
      !context.report.beneficiaryFirstname && legacyBeneficiaries.size > 1,
  };
}

export function guardExpenseReportWizardStep(
  context: Awaited<ReturnType<typeof loadExpenseReportWizard>>,
  step: ExpenseReportStep,
  assoSlug: string,
  reportId: string,
) {
  if (
    step !== "recapitulatif" &&
    (!context.editable || context.legacyMultiBeneficiary)
  ) {
    redirect(expenseReportStepHref(assoSlug, reportId, "recapitulatif"));
  }
  if (step === "recapitulatif" && context.legacyMultiBeneficiary) return;

  const firstIncomplete = firstIncompleteExpenseReportStep(context.completion);
  if (
    context.editable &&
    EXPENSE_REPORT_STEPS.indexOf(step) >
      EXPENSE_REPORT_STEPS.indexOf(firstIncomplete)
  ) {
    redirect(expenseReportStepHref(assoSlug, reportId, firstIncomplete));
  }
}
