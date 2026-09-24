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
import { pluralize } from "@/lib/plural";

/**
 * Ligne dense pour la liste Admin des Notes de frais — même forme que
 * `ExpenseReportRow` côté Structure (pastille de statut en tête, badge texte
 * en fin, cf. règle "Status/badge placement" de docs/design/COMPONENTS.md),
 * mais avec le nom de l'Asso en sous-titre à la place de la description
 * (l'Admin voit toutes les Structures, la description d'une Note lui importe
 * moins que savoir de quelle Asso elle vient). Comme côté Structure, la
 * grille dense (title/asso/prix/badge côte à côte) n'a plus la place sous
 * `sm` : on bascule sur une carte empilée pour éviter le chevauchement.
 */
export function AdminExpenseReportRow({
  report,
  striped = false,
}: {
  report: ExpenseReportOverviewForAdmin;
  striped?: boolean;
}) {
  const href = `/app/admin/notes-de-frais/${report.id}`;
  const rowBg = striped ? "bg-base-200/60" : "";

  return (
    <>
      <Link
        href={href}
        className={`flex flex-col gap-1 px-4 py-2.5 hover:bg-base-300/40 sm:hidden ${rowBg}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`size-2.5 shrink-0 rounded-full ${expenseReportStatusDotClass[report.status]}`}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate font-medium">
            {report.title}
          </span>
          <span
            className={`badge badge-sm shrink-0 ${expenseReportStatusBadgeClass[report.status]}`}
          >
            {expenseReportStatusLabel[report.status]}
          </span>
        </div>
        <div className="truncate pl-[1.125rem] text-xs text-base-content/60">
          {report.assoName}
        </div>
        <div className="flex items-center justify-between pl-[1.125rem] text-xs text-base-content/60">
          <span>{pluralize(report.linesCount, "dépense")}</span>
          <span className="font-medium text-base-content/70">
            {formatCents(report.totalAmountCents)}
          </span>
        </div>
      </Link>

      <Link
        href={href}
        className={`hidden items-center gap-3 px-4 py-2.5 hover:bg-base-300/40 sm:flex ${rowBg}`}
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
        <div className="hidden w-36 shrink-0 whitespace-nowrap text-right text-sm text-base-content/70 sm:block">
          {pluralize(report.linesCount, "dépense")}
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
    </>
  );
}
