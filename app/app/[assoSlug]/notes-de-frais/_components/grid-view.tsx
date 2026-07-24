import Link from "next/link";
import type { ExpenseReportOverview } from "@/lib/expense-reports/expense-reports";
import {
  expenseReportStatusBadgeClass,
  expenseReportStatusLabel,
} from "@/lib/expense-reports/labels";
import { formatCents } from "@/lib/money";

export function GridView({
  assoSlug,
  reports,
}: {
  assoSlug: string;
  reports: ExpenseReportOverview[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <div
          key={report.id}
          className="card border border-base-300 bg-base-100 shadow-md"
        >
          <div className="card-body">
            <div className="flex items-start justify-between gap-2">
              <h2 className="card-title text-base">{report.title}</h2>
              <span
                className={`badge ${expenseReportStatusBadgeClass[report.status]}`}
              >
                {expenseReportStatusLabel[report.status]}
              </span>
            </div>
            {report.description && (
              <p className="text-sm text-base-content/70">
                {report.description}
              </p>
            )}
            <p className="text-2xl">{formatCents(report.totalAmountCents)}</p>
            <p className="text-sm text-base-content/70">
              {report.linesCount} ligne(s)
            </p>
            <div className="card-actions justify-end">
              <Link
                href={`/app/${assoSlug}/notes-de-frais/${report.id}`}
                className="btn btn-sm"
              >
                Voir le détail
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
