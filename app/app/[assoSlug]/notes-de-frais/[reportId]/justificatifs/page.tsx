import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  expenseReportStepHref,
  guardExpenseReportWizardStep,
  loadExpenseReportWizard,
} from "@/lib/expense-reports/expense-report-wizard";
import { SupportingDocumentsPanel } from "../_components/supporting-documents-panel";

export default async function SupportingDocumentsPage({
  params,
}: {
  params: Promise<{ assoSlug: string; reportId: string }>;
}) {
  const { assoSlug, reportId } = await params;
  const context = await loadExpenseReportWizard(assoSlug, reportId);
  guardExpenseReportWizardStep(context, "justificatifs", assoSlug, reportId);
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Justificatifs</h2>
        <p className="mt-1 text-sm text-base-content/70">
          Ajoutez vos factures, ou une Attestation sur l&apos;honneur si vous
          n&apos;en avez pas.
        </p>
      </div>
      <SupportingDocumentsPanel
        assoSlug={assoSlug}
        reportId={reportId}
        documents={context.report.supportingDocuments}
        editable={context.editable}
      />
      <div className="mt-6 flex justify-between gap-3">
        <Link
          className="btn btn-ghost"
          href={expenseReportStepHref(assoSlug, reportId, "remboursements")}
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
        {context.completion.justificatifs ? (
          <Link
            className="btn btn-primary"
            href={expenseReportStepHref(assoSlug, reportId, "beneficiaire")}
          >
            Continuer
            <ArrowRight size={16} />
          </Link>
        ) : (
          <button className="btn btn-primary" disabled>
            Ajoutez un Justificatif pour continuer
          </button>
        )}
      </div>
    </section>
  );
}
