import Link from "next/link";
import {
  expenseReportStatusBadgeClass,
  expenseReportStatusLabel,
} from "@/lib/expense-reports/labels";
import {
  getExpenseReportDetailForAdmin,
  isExpenseReportEditableByAdmin,
} from "@/lib/admin/expense-reports";
import { updateExpenseReportAsAdminAction } from "@/lib/admin/expense-report-actions";
import { GeneralInformationModal } from "@/components/expense-reports/general-information-modal";
import { AdminExpenseReportStepper } from "./_components/expense-report-stepper";

export default async function AdminExpenseReportWizardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const report = await getExpenseReportDetailForAdmin(reportId);
  const editable = isExpenseReportEditableByAdmin(report.status);

  return (
    <div>
      <Link
        href="/app/admin/notes-de-frais"
        className="link link-hover text-sm text-base-content/70"
      >
        ← Toutes les Notes de frais
      </Link>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{report.title}</h1>
          <p className="mt-1 text-sm text-base-content/70">
            {report.assoName}
          </p>
          {report.description && (
            <p className="mt-1 text-sm text-base-content/70">
              {report.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editable && (
            <GeneralInformationModal
              reportId={reportId}
              title={report.title}
              description={report.description}
              action={updateExpenseReportAsAdminAction}
            />
          )}
          <span
            className={`badge ${expenseReportStatusBadgeClass[report.status]}`}
          >
            {expenseReportStatusLabel[report.status]}
          </span>
        </div>
      </div>
      {!editable && report.status === "SUBMITTED" && (
        <div role="status" className="alert alert-info alert-soft mt-5">
          Prenez cette Note de frais en charge pour pouvoir la modifier.
        </div>
      )}
      <AdminExpenseReportStepper reportId={reportId} />
      <div className="mt-5">{children}</div>
    </div>
  );
}
