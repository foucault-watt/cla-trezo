import Link from "next/link";
import { getExpenseReportDetail } from "@/lib/expense-reports/expense-reports";
import {
  expenseReportStatusBadgeClass,
  expenseReportStatusLabel,
} from "@/lib/expense-reports/labels";
import { formatCents } from "@/lib/money";
import { AddLigneForm } from "./_components/add-ligne-form";
import { EditExpenseReportForm } from "./_components/edit-expense-report-form";
import { LigneRow } from "./_components/ligne-row";

export default async function ExpenseReportDetailPage({
  params,
}: {
  params: Promise<{ assoSlug: string; reportId: string }>;
}) {
  const { assoSlug, reportId } = await params;
  const { report, assoType, typeDepenses, visibleSubventions } =
    await getExpenseReportDetail(assoSlug, reportId);

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

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-md">
          <table className="table">
            <thead>
              <tr>
                <th>Bénéficiaire</th>
                <th>Type de dépense</th>
                <th>Montant</th>
                <th>Source</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {report.lines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-base-content/70">
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
