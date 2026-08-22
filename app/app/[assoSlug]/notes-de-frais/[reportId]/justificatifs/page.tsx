import { redirect } from "next/navigation";
import { expenseReportStepHref } from "@/lib/expense-reports/expense-report-wizard";

export default async function SupportingDocumentsPage({
  params,
}: {
  params: Promise<{ assoSlug: string; reportId: string }>;
}) {
  const { assoSlug, reportId } = await params;
  redirect(expenseReportStepHref(assoSlug, reportId, "remboursements"));
}
