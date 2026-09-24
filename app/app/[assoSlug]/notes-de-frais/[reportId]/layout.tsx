import { BackLink } from "@/components/nav/back-link";
import {
  expenseReportStatusBadgeClass,
  expenseReportStatusLabel,
} from "@/lib/expense-reports/labels";
import { loadExpenseReportWizard } from "@/lib/expense-reports/expense-report-wizard";
import { updateExpenseReportAction } from "@/lib/expense-reports/expense-report-actions";
import { ExpenseReportStepper } from "./_components/expense-report-stepper";
import { GeneralInformationModal } from "@/components/expense-reports/general-information-modal";

export default async function ExpenseReportWizardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ assoSlug: string; reportId: string }>;
}) {
  const { assoSlug, reportId } = await params;
  const context = await loadExpenseReportWizard(assoSlug, reportId);
  const { report } = context;

  return (
    <div>
      <BackLink
        href={`/app/${assoSlug}/notes-de-frais`}
        label="Toutes les Notes de frais"
      />
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{report.title}</h1>
          {report.description && (
            <p className="mt-1 text-sm text-base-content/70">
              {report.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {context.editable && (
            <GeneralInformationModal
              assoSlug={assoSlug}
              reportId={reportId}
              title={report.title}
              description={report.description}
              action={updateExpenseReportAction}
            />
          )}
          <span
            className={`badge ${expenseReportStatusBadgeClass[report.status]}`}
          >
            {expenseReportStatusLabel[report.status]}
          </span>
        </div>
      </div>
      {!context.editable && report.status === "TAKEN_OVER" && (
        <div role="status" className="alert alert-info alert-soft mt-5">
          L&apos;Admin CLA traite désormais cette Note de frais. Elle est
          disponible en lecture seule.
        </div>
      )}
      {context.editable && (
        <ExpenseReportStepper
          assoSlug={assoSlug}
          reportId={reportId}
          completion={context.completion}
          editable={context.editable}
        />
      )}
      <div className="mt-5">{children}</div>
    </div>
  );
}
