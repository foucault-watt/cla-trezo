import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getClubSolde } from "@/lib/solde/actions";
import {
  expenseReportStepHref,
  guardExpenseReportWizardStep,
  loadExpenseReportWizard,
} from "@/lib/expense-reports/expense-report-wizard";
import {
  addSupportingDocumentsAction,
  removeSupportingDocumentAction,
} from "@/lib/expense-reports/supporting-document-actions";
import { ReimbursementsTable } from "@/components/expense-reports/reimbursements-table";
import { SupportingDocumentsPanel } from "@/components/expense-reports/supporting-documents-panel";

export default async function ReimbursementsPage({
  params,
}: {
  params: Promise<{ assoSlug: string; reportId: string }>;
}) {
  const { assoSlug, reportId } = await params;
  const [context, soldeView] = await Promise.all([
    loadExpenseReportWizard(assoSlug, reportId),
    getClubSolde(assoSlug),
  ]);
  guardExpenseReportWizardStep(context, "remboursements", assoSlug, reportId);

  return (
    <section className="space-y-5">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Dépenses et justificatifs</h2>
        <p className="mt-1 text-sm text-base-content/70">
          Renseignez ce qui doit être remboursé, puis joignez les preuves
          correspondantes.
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
          assoSlug={assoSlug}
          expenseReportId={reportId}
          lines={context.report.lines}
          assoType={context.assoType}
          typeDepenses={context.typeDepenses}
          visibleSubventions={context.visibleSubventions}
          soldeView={soldeView}
          editable={context.editable}
        />
      </section>
      <div className="ml-7 h-5 border-l-2 border-dashed border-base-300" />
      <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-md sm:p-6">
        <div className="mb-4">
          <h3 className="font-semibold">Justificatifs</h3>
          <p className="text-xs text-base-content/60">
            Ajoutez vos factures, ou une Attestation sur l&apos;honneur si vous
            n&apos;en avez pas.
          </p>
        </div>
        <SupportingDocumentsPanel
          assoSlug={assoSlug}
          reportId={reportId}
          basePath={`/app/${assoSlug}/notes-de-frais/${reportId}`}
          documents={context.report.supportingDocuments}
          editable={context.editable}
          addAction={addSupportingDocumentsAction}
          removeAction={removeSupportingDocumentAction}
        />
      </section>
      <div className="flex justify-end pt-1">
        {context.completion.remboursements ? (
          <Link
            className="btn btn-primary"
            href={expenseReportStepHref(assoSlug, reportId, "beneficiaire")}
          >
            Choisir le bénéficiaire
            <ArrowRight size={16} />
          </Link>
        ) : (
          <button className="btn btn-primary" disabled>
            Ajoutez une dépense et un justificatif pour continuer
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </section>
  );
}
