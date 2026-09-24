import Link from "next/link";
import { formatCents } from "@/lib/money";
import { formatShortDate } from "@/lib/dates";
import type { ExpenseReportOverviewForAsso } from "@/lib/admin/expense-reports";
import {
  beneficiaryShortName,
  expenseReportStatusBadgeClass,
  expenseReportStatusLabel,
  fundingSourceLabel,
} from "@/lib/expense-reports/labels";

/**
 * Liste en lecture seule des Notes de frais d'une Structure — l'Admin ne
 * peut pas en créer depuis cette page, seulement les consulter (le
 * traitement se fait depuis /app/admin/notes-de-frais).
 */
export function NotesDeFraisList({
  reports,
}: {
  reports: ExpenseReportOverviewForAsso[];
}) {
  if (reports.length === 0) {
    return (
      <p className="text-sm text-base-content/60">
        Aucune Note de frais pour l&apos;instant.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-base-200">
      {reports.map((report) => (
        <li key={report.id} className="py-2 text-sm">
          <Link
            href={`/app/admin/notes-de-frais/${report.id}`}
            className="flex flex-wrap items-center justify-between gap-2 hover:underline"
          >
            <div>
              <span className="font-medium">
                {beneficiaryShortName(
                  report.beneficiaryFirstname,
                  report.beneficiaryLastname,
                ) ?? report.title}
              </span>
              <span
                className={`ml-2 badge badge-sm badge-soft ${expenseReportStatusBadgeClass[report.status]}`}
              >
                {expenseReportStatusLabel[report.status]}
              </span>
              <div className="mt-0.5 text-xs text-base-content/50">
                {formatShortDate(report.createdAt)}
                {report.fundingSources.length > 0 &&
                  ` · Financée sur ${report.fundingSources
                    .map((source) => fundingSourceLabel[source])
                    .join(", ")}`}
              </div>
            </div>
            <span className="font-medium tabular-nums">
              {formatCents(report.totalAmountCents)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
