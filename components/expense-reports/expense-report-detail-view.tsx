import type { ReactNode } from "react";
import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";
import {
  expenseReportStatusBadgeClass,
  expenseReportStatusLabel,
} from "@/lib/expense-reports/labels";
import { formatCents } from "@/lib/money";
import type { ExpenseReportLineDetail } from "@/lib/expense-reports/expense-report-detail-mapping";

/**
 * En-tête (titre, description, statut) et bloc statistiques d'une Note de
 * frais, partagés par la page de détail Structure et la page de détail Admin
 * (cf. issue #30). `subtitle` porte la seule ligne propre à l'Admin (nom de
 * la Structure) — pas de champ dédié, pour ne pas figer un contenu
 * spécifique dans un composant partagé.
 */
export function ExpenseReportDetailHeader({
  report,
  subtitle,
}: {
  report: {
    title: string;
    description: string | null;
    status: ExpenseReportStatus;
    lines: Pick<ExpenseReportLineDetail, "amountCents">[];
  };
  subtitle?: ReactNode;
}) {
  const totalAmountCents = report.lines.reduce(
    (sum, line) => sum + line.amountCents,
    0,
  );

  return (
    <>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{report.title}</h1>
          {subtitle}
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
    </>
  );
}
