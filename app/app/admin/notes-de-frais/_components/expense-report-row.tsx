import Link from "next/link";
import type { ExpenseReportOverviewForAdmin } from "@/lib/admin/expense-reports";
import {
  beneficiaryShortName,
  expenseReportStatusBadgeClass,
  expenseReportStatusDotClass,
  expenseReportStatusLabel,
} from "@/lib/expense-reports/labels";
import { formatShortDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";

/**
 * Ligne dense pour la liste Admin des Notes de frais — même forme que
 * `ExpenseReportRow` côté Structure (pastille de statut en tête, badge texte
 * en fin, cf. règle "Status/badge placement" de docs/design/COMPONENTS.md),
 * mais avec le nom de l'Asso en sous-titre à la place de la description
 * (l'Admin voit toutes les Structures, la description d'une Note lui importe
 * moins que savoir de quelle Asso elle vient).
 */
export function AdminExpenseReportRow({
  report,
  striped = false,
}: {
  report: ExpenseReportOverviewForAdmin;
  striped?: boolean;
}) {
  return (
    <Link
      href={`/app/admin/notes-de-frais/${report.id}`}
      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-base-300/40 ${
        striped ? "bg-base-200/60" : ""
      }`}
    >
      <span
        className={`size-2.5 shrink-0 rounded-full ${expenseReportStatusDotClass[report.status]}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <span className="truncate font-medium">{report.title}</span>
        <div className="truncate text-xs text-base-content/60">
          {report.assoName}
        </div>
      </div>
      <div className="hidden w-24 shrink-0 text-right text-xs text-base-content/60 lg:block">
        {formatShortDate(report.createdAt)}
      </div>
      <div className="hidden w-28 shrink-0 truncate text-right text-sm text-base-content/70 md:block">
        {beneficiaryShortName(
          report.beneficiaryFirstname,
          report.beneficiaryLastname,
        ) ?? "—"}
      </div>
      <div className="hidden w-28 shrink-0 text-right text-sm text-base-content/70 sm:block">
        {report.linesCount} remboursement(s)
      </div>
      <div className="w-28 shrink-0 text-right text-sm text-base-content/70">
        {formatCents(report.totalAmountCents)}
      </div>
      <div className="flex w-36 shrink-0 justify-end">
        <span className={`badge ${expenseReportStatusBadgeClass[report.status]}`}>
          {expenseReportStatusLabel[report.status]}
        </span>
      </div>
    </Link>
  );
}
