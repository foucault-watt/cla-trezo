import Link from "next/link";
import type { ExpenseReportOverview } from "@/lib/expense-reports/expense-reports";
import {
  beneficiaryShortName,
  expenseReportStatusBadgeClass,
  expenseReportStatusDotClass,
  expenseReportStatusLabel,
} from "@/lib/expense-reports/labels";
import { formatShortDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";

/**
 * Ligne dense partagée par toutes les variantes d'affichage de la liste des
 * Notes de frais : pastille de statut en tête (largeur fixe), badge texte en
 * fin (cf. règle "Status/badge placement" de docs/design/COMPONENTS.md). Le
 * zébrage est piloté par l'appelant via `striped` pour rester correct quand la
 * liste est filtrée/regroupée.
 */
export function ExpenseReportRow({
  assoSlug,
  report,
  striped = false,
}: {
  assoSlug: string;
  report: ExpenseReportOverview;
  striped?: boolean;
}) {
  return (
    <Link
      href={`/app/${assoSlug}/notes-de-frais/${report.id}`}
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
        {report.description && (
          <div className="truncate text-xs text-base-content/60">
            {report.description}
          </div>
        )}
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
      <div className="hidden w-24 shrink-0 text-right text-sm text-base-content/70 sm:block">
        {report.linesCount} dépense(s)
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
