import Link from "next/link";
import type { ExpenseReportOverview } from "@/lib/expense-reports/expense-reports";
import {
  expenseReportStatusBadgeClass,
  expenseReportStatusDotClass,
  expenseReportStatusLabel,
} from "@/lib/expense-reports/labels";
import { formatCents } from "@/lib/money";

export function ListView({
  assoSlug,
  reports,
}: {
  assoSlug: string;
  reports: ExpenseReportOverview[];
}) {
  return (
    <div className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-md">
      {reports.map((report, i) => (
        <Link
          key={report.id}
          href={`/app/${assoSlug}/notes-de-frais/${report.id}`}
          className={`flex items-center gap-3 px-4 py-2.5 hover:bg-base-300/40 ${
            i % 2 === 1 ? "bg-base-200/60" : ""
          }`}
        >
          <span
            className={`size-2.5 shrink-0 rounded-full ${expenseReportStatusDotClass[report.status]}`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <span className="truncate font-medium">{report.title}</span>
            {report.description && (
              <div className="truncate text-xs text-base-content/60">
                {report.description}
              </div>
            )}
          </div>
          <div className="hidden w-24 shrink-0 text-right text-sm text-base-content/70 sm:block">
            {report.linesCount} ligne(s)
          </div>
          <div className="w-28 shrink-0 text-right text-sm text-base-content/70">
            {formatCents(report.totalAmountCents)}
          </div>
          <span
            className={`badge shrink-0 ${expenseReportStatusBadgeClass[report.status]}`}
          >
            {expenseReportStatusLabel[report.status]}
          </span>
        </Link>
      ))}
    </div>
  );
}
