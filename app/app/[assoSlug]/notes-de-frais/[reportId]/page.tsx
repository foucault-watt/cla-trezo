import Link from "next/link";
import { getExpenseReportDetail } from "@/lib/expense-reports/expense-reports";
import { getClubSolde } from "@/lib/solde/actions";
import {
  assertExpenseReportMutable,
  ExpenseReportLifecycleError,
} from "@/lib/expense-reports/expense-report-lifecycle";
import {
  ExpenseReportDetailHeader,
  ExpenseReportLinesTable,
} from "@/components/expense-reports/expense-report-detail-view";
import { AddLigneForm } from "./_components/add-ligne-form";
import { EditExpenseReportForm } from "./_components/edit-expense-report-form";
import { FundingSourcesPanel } from "./_components/funding-sources-panel";
import { LigneRow } from "./_components/ligne-row";
import { SubmitExpenseReportForm } from "./_components/submit-expense-report-form";
import { SubventionSelectionProvider } from "./_components/subvention-selection-context";
import { SupportingDocumentsPanel } from "./_components/supporting-documents-panel";

export default async function ExpenseReportDetailPage({
  params,
}: {
  params: Promise<{ assoSlug: string; reportId: string }>;
}) {
  const { assoSlug, reportId } = await params;
  const [{ report, assoId, assoType, typeDepenses, visibleSubventions }, soldeView] =
    await Promise.all([
      getExpenseReportDetail(assoSlug, reportId),
      getClubSolde(assoSlug),
    ]);

  let editable = true;
  try {
    assertExpenseReportMutable({
      status: report.status,
      actor: { type: "STRUCTURE", assoId },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    editable = false;
  }

  return (
    <div>
      <Link
        href={`/app/${assoSlug}/notes-de-frais`}
        className="link link-hover text-sm text-base-content/70"
      >
        ← Toutes les Notes de frais
      </Link>

      <ExpenseReportDetailHeader report={report} />

      <div className="mt-6">
        <SupportingDocumentsPanel
          assoSlug={assoSlug}
          reportId={report.id}
          documents={report.supportingDocuments}
          editable={editable}
        />
      </div>

      <SubventionSelectionProvider>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6">
            <ExpenseReportLinesTable
              lines={report.lines}
              showIban={false}
              renderLine={(line) => (
                <LigneRow
                  key={line.id}
                  assoSlug={assoSlug}
                  line={line}
                  assoType={assoType}
                  typeDepenses={typeDepenses}
                  visibleSubventions={visibleSubventions}
                  editable={editable}
                />
              )}
            />

            <div className="collapse-arrow collapse border border-base-300 bg-base-100 shadow-md lg:hidden">
              <input type="checkbox" />
              <div className="collapse-title font-medium">
                Mes sources de financement
              </div>
              <div className="collapse-content">
                <FundingSourcesPanel
                  assoType={assoType}
                  soldeView={soldeView}
                  visibleSubventions={visibleSubventions}
                />
              </div>
            </div>

            {editable && (
              <AddLigneForm
                assoSlug={assoSlug}
                expenseReportId={report.id}
                assoType={assoType}
                typeDepenses={typeDepenses}
                visibleSubventions={visibleSubventions}
              />
            )}
          </div>

          <div className="hidden lg:sticky lg:top-4 lg:block lg:self-start">
            <FundingSourcesPanel
              assoType={assoType}
              soldeView={soldeView}
              visibleSubventions={visibleSubventions}
            />
          </div>
        </div>
      </SubventionSelectionProvider>

      {editable && (
        <EditExpenseReportForm
          assoSlug={assoSlug}
          reportId={report.id}
          title={report.title}
          description={report.description}
        />
      )}

      {report.status === "DRAFT" && (
        <div className="mt-6">
          <SubmitExpenseReportForm assoSlug={assoSlug} reportId={report.id} />
        </div>
      )}
    </div>
  );
}
