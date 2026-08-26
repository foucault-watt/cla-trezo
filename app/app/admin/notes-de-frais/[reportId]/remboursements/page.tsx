import {
  getExpenseReportDetailForAdmin,
  isExpenseReportEditableByAdmin,
} from "@/lib/admin/expense-reports";
import {
  addReimbursementAsAdminAction,
  deleteReimbursementAsAdminAction,
  updateReimbursementAsAdminAction,
} from "@/lib/admin/expense-report-actions";
import {
  addSupportingDocumentsAsAdminAction,
  removeSupportingDocumentAsAdminAction,
} from "@/lib/admin/supporting-document-actions";
import { ReimbursementsTable } from "@/components/expense-reports/reimbursements-table";
import { SupportingDocumentsPanel } from "@/components/expense-reports/supporting-documents-panel";
import Link from "next/link";
import { TakeOverButton } from "../_components/take-over-button";

export default async function AdminReimbursementsPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const report = await getExpenseReportDetailForAdmin(reportId);
  const editable = isExpenseReportEditableByAdmin(report.status);

  return (
    <section className="space-y-5">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Dépenses et justificatifs</h2>
        <p className="mt-1 text-sm text-base-content/70">
          Corrigez les dépenses et les justificatifs de cette Note de frais.
        </p>
      </div>
      <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-md sm:p-6">
        <div className="mb-4">
          <h3 className="font-semibold">Dépenses</h3>
          <p className="text-xs text-base-content/60">
            Ajoutez et corrigez les dépenses directement dans le tableau.
          </p>
        </div>
        <ReimbursementsTable
          assoSlug={report.assoSlug}
          expenseReportId={reportId}
          lines={report.lines}
          assoType={report.assoType}
          typeDepenses={report.typeDepenses}
          visibleSubventions={report.visibleSubventions}
          soldeView={report.soldeView}
          editable={editable}
          addAction={addReimbursementAsAdminAction}
          updateAction={updateReimbursementAsAdminAction}
          deleteAction={deleteReimbursementAsAdminAction}
        />
      </section>
      <div className="ml-7 h-5 border-l-2 border-dashed border-base-300" />
      <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-md sm:p-6">
        <div className="mb-4">
          <h3 className="font-semibold">Justificatifs</h3>
          <p className="text-xs text-base-content/60">
            Ajoutez ou retirez des factures, ou une Attestation sur l&apos;honneur.
          </p>
        </div>
        <SupportingDocumentsPanel
          reportId={reportId}
          basePath={`/app/admin/notes-de-frais/${reportId}`}
          documents={report.supportingDocuments}
          editable={editable}
          addAction={addSupportingDocumentsAsAdminAction}
          removeAction={removeSupportingDocumentAsAdminAction}
        />
      </section>
      {report.status === "SUBMITTED" && (
        <div className="flex justify-end pt-1">
          <TakeOverButton reportId={reportId} />
        </div>
      )}
      {report.status === "TAKEN_OVER" && (
        <div className="flex justify-end pt-1">
          <Link
            href={`/app/admin/notes-de-frais/${reportId}/valider`}
            className="btn btn-primary"
          >
            Valider
          </Link>
        </div>
      )}
    </section>
  );
}
