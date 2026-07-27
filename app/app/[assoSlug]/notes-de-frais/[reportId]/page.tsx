import Link from "next/link";
import { getExpenseReportDetail } from "@/lib/expense-reports/expense-reports";
import { getClubSolde } from "@/lib/solde/actions";
import {
  expenseReportStatusBadgeClass,
  expenseReportStatusLabel,
} from "@/lib/expense-reports/labels";
import { formatCents } from "@/lib/money";
import { AddLigneForm } from "./_components/add-ligne-form";
import { EditExpenseReportForm } from "./_components/edit-expense-report-form";
import { FundingSourcesPanel } from "./_components/funding-sources-panel";
import { LigneRow } from "./_components/ligne-row";
import { SubventionSelectionProvider } from "./_components/subvention-selection-context";
import { SupportingDocumentsPanel } from "./_components/supporting-documents-panel";

export default async function ExpenseReportDetailPage({
  params,
}: {
  params: Promise<{ assoSlug: string; reportId: string }>;
}) {
  const { assoSlug, reportId } = await params;
  const [{ report, assoType, typeDepenses, visibleSubventions }, soldeView] =
    await Promise.all([
      getExpenseReportDetail(assoSlug, reportId),
      getClubSolde(assoSlug),
    ]);

  const totalAmountCents = report.lines.reduce(
    (sum, line) => sum + line.amountCents,
    0,
  );

  return (
    <div>
      <Link
        href={`/app/${assoSlug}/notes-de-frais`}
        className="link link-hover text-sm text-base-content/70"
      >
        ← Toutes les Notes de frais
      </Link>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{report.title}</h1>
          {report.description && (
            <p className="mt-1 text-sm text-base-content/70">
              {report.description}
            </p>
          )}
        </div>
        <span
          className={`badge ${expenseReportStatusBadgeClass[report.status]}`}
        >
          {expenseReportStatusLabel[report.status]}
        </span>
      </div>

      <div className="stats stats-vertical mt-6 w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal">
        <div className="stat">
          <div className="stat-title">Lignes</div>
          <div className="stat-value text-2xl">{report.lines.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Montant total</div>
          <div className="stat-value text-2xl">
            {formatCents(totalAmountCents)}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SupportingDocumentsPanel
          assoSlug={assoSlug}
          reportId={report.id}
          documents={report.supportingDocuments}
          editable={report.status === "DRAFT"}
        />
      </div>

      <SubventionSelectionProvider>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6">
            <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-md">
              <table className="table">
                <thead>
                  <tr>
                    <th>Bénéficiaire</th>
                    <th>Nom de la dépense</th>
                    <th>Type de dépense</th>
                    <th>Montant</th>
                    <th>Source</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {report.lines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-base-content/70">
                        Aucune Ligne pour l&apos;instant.
                      </td>
                    </tr>
                  ) : (
                    report.lines.map((line) => (
                      <LigneRow
                        key={line.id}
                        assoSlug={assoSlug}
                        line={line}
                        assoType={assoType}
                        typeDepenses={typeDepenses}
                        visibleSubventions={visibleSubventions}
                        editable={report.status === "DRAFT"}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

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

            {report.status === "DRAFT" && (
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

      {report.status === "DRAFT" && (
        <EditExpenseReportForm
          assoSlug={assoSlug}
          reportId={report.id}
          title={report.title}
          description={report.description}
        />
      )}
    </div>
  );
}
