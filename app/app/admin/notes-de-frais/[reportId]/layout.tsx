import { BackLink } from "@/components/nav/back-link";
import {
  expenseReportStatusBadgeClass,
  expenseReportStatusLabel,
  fundingSourceLabel,
} from "@/lib/expense-reports/labels";
import {
  getExpenseReportDetailForAdmin,
  isExpenseReportEditableByAdmin,
} from "@/lib/admin/expense-reports";
import { updateExpenseReportAsAdminAction } from "@/lib/admin/expense-report-actions";
import { GeneralInformationModal } from "@/components/expense-reports/general-information-modal";
import { AdminExpenseReportStepper } from "./_components/expense-report-stepper";
import { DeleteExpenseReportAsAdminButton } from "./_components/delete-expense-report-as-admin-button";
import { PdfDownloadButton } from "./_components/pdf-download-button";

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
      <BackLink
        href="/app/admin/notes-de-frais"
        label="Toutes les Notes de frais"
      />
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
        <div className="flex flex-wrap items-center gap-2">
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
          <DeleteExpenseReportAsAdminButton
            reportId={reportId}
            status={report.status}
          />
        </div>
      </div>
      {!editable && report.status === "SUBMITTED" && (
        <div role="status" className="alert alert-info alert-soft mt-5">
          Prenez cette Note de frais en charge pour pouvoir la modifier.
        </div>
      )}
      {report.status === "FINALIZED" && report.pdfs.length > 0 && (
        <div className="mt-5 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
          <h2 className="text-sm font-semibold">PDF finaux</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {report.pdfs.map((pdf) => (
              <li key={pdf.id}>
                <PdfDownloadButton
                  reportId={reportId}
                  pdfId={pdf.id}
                  label={pdf.subventionReason ?? fundingSourceLabel[pdf.fundingSource]}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
      <AdminExpenseReportStepper reportId={reportId} />
      <div className="mt-5">{children}</div>
    </div>
  );
}
