import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getClubSolde } from "@/lib/solde/actions";
import {
  expenseReportStepHref,
  guardExpenseReportWizardStep,
  loadExpenseReportWizard,
} from "@/lib/expense-reports/expense-report-wizard";
import { ReimbursementsTable } from "../_components/reimbursements-table";

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
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Remboursements</h2>
        <p className="mt-1 text-sm text-base-content/70">
          Ajoutez chaque dépense et choisissez la source qui doit la financer.
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
      <div className="mt-6 flex justify-end">
        {context.completion.remboursements ? (
          <Link
            className="btn btn-primary"
            href={expenseReportStepHref(assoSlug, reportId, "justificatifs")}
          >
            Continuer
            <ArrowRight size={16} />
          </Link>
        ) : (
          <button className="btn btn-primary" disabled>
            Ajoutez un Remboursement pour continuer
          </button>
        )}
      </div>
    </section>
  );
}
