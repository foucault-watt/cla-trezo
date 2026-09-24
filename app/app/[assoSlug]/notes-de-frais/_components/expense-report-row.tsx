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
import { pluralize } from "@/lib/plural";

/**
 * Ligne dense partagée par toutes les variantes d'affichage de la liste des
 * Notes de frais : pastille de statut en tête (largeur fixe), badge texte en
 * fin (cf. règle "Status/badge placement" de docs/design/COMPONENTS.md). Le
 * zébrage est piloté par l'appelant via `striped` pour rester correct quand la
 * liste est filtrée/regroupée.
 *
 * En dessous de `sm`, la ligne dense (title/desc/prix/badge côte à côte)
 * n'a plus la place : titre + description finissent par se chevaucher. On
 * bascule donc sur une carte empilée sur mobile plutôt que de forcer la même
 * grille sur une largeur trop étroite.
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
  const href = `/app/${assoSlug}/notes-de-frais/${report.id}`;
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
        {report.description && (
          <div className="truncate pl-[1.125rem] text-xs text-base-content/60">
            {report.description}
          </div>
        )}
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
        <div className="hidden w-28 shrink-0 whitespace-nowrap text-right text-sm text-base-content/70 sm:block">
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
