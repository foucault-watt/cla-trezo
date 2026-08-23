import { redirect } from "next/navigation";
import {
  expenseReportStepHref,
  expenseReportSummaryHref,
  firstIncompleteExpenseReportStep,
  loadExpenseReportWizard,
} from "@/lib/expense-reports/expense-report-wizard";

export default async function ExpenseReportEntryPage({
  params,
}: {
  params: Promise<{ assoSlug: string; reportId: string }>;
}) {
  const { assoSlug, reportId } = await params;
  const context = await loadExpenseReportWizard(assoSlug, reportId);
  const step = context.editable
    ? firstIncompleteExpenseReportStep(context.completion)
    : null;
  redirect(
    step
      ? expenseReportStepHref(assoSlug, reportId, step)
      : expenseReportSummaryHref(assoSlug, reportId),
  );
}
