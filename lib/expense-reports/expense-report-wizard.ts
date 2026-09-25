import { redirect } from "next/navigation";
import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";
import { isExpenseReportMutable } from "./expense-report-lifecycle";
import { getExpenseReportDetail } from "./expense-reports";
import {
  EXPENSE_REPORT_STEPS,
  expenseReportSummaryHref,
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
    remboursements: reimbursements && supportingDocuments,
    beneficiaire: beneficiary,
  };
}

/**
 * Note modifiable depuis l'espace Structure : statut encore ouvert à la
 * Structure (cf. expense-report-lifecycle.ts) et accès de membre — un Admin
 * non membre n'y a qu'une lecture (ADR-0001).
 */
export function isEditableInStructureSpace({
  status,
  assoId,
  readOnlyAsAdmin,
}: {
  status: ExpenseReportStatus;
  assoId: string;
  readOnlyAsAdmin: boolean;
}): boolean {
  return (
    !readOnlyAsAdmin &&
    isExpenseReportMutable({ status, actor: { type: "STRUCTURE", assoId } })
  );
}

export async function loadExpenseReportWizard(
  assoSlug: string,
  reportId: string,
) {
  const context = await getExpenseReportDetail(assoSlug, reportId);
  const completion = computeExpenseReportStepCompletion(context.report);
  return {
    ...context,
    completion,
    editable: isEditableInStructureSpace({
      status: context.report.status,
      assoId: context.assoId,
      readOnlyAsAdmin: context.readOnlyAsAdmin,
    }),
  };
}

export function guardExpenseReportWizardStep(
  context: Awaited<ReturnType<typeof loadExpenseReportWizard>>,
  step: ExpenseReportStep,
  assoSlug: string,
  reportId: string,
) {
  if (!context.editable) {
    redirect(expenseReportSummaryHref(assoSlug, reportId));
  }

  const firstIncomplete = firstIncompleteExpenseReportStep(context.completion);
  if (
    context.editable &&
    EXPENSE_REPORT_STEPS.indexOf(step) >
      EXPENSE_REPORT_STEPS.indexOf(firstIncomplete)
  ) {
    redirect(expenseReportStepHref(assoSlug, reportId, firstIncomplete));
  }
}

export function guardExpenseReportSummary(
  context: Awaited<ReturnType<typeof loadExpenseReportWizard>>,
  assoSlug: string,
  reportId: string,
) {
  if (!context.editable) return;
  redirect(
    expenseReportStepHref(
      assoSlug,
      reportId,
      firstIncompleteExpenseReportStep(context.completion),
    ),
  );
}
