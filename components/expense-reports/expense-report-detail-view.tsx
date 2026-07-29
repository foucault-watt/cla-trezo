import type { ReactNode } from "react";
import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";
import {
  expenseReportStatusBadgeClass,
  expenseReportStatusLabel,
} from "@/lib/expense-reports/labels";
import { formatCents } from "@/lib/money";
import type { ExpenseReportLineDetail } from "@/lib/expense-reports/expense-report-detail-mapping";

const LINE_COLUMN_COUNT = 6;

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

/**
 * Table des Lignes d'une Note de frais, partagée par la page de détail
 * Structure et la page de détail Admin (cf. issue #30). `showIban` est la
 * seule vraie différence entre les deux vues (ADR-0002) : quand elle est
 * fausse, la colonne d'actions (Modifier) prend sa place à la fin de la
 * ligne, gérée entièrement par `renderLine` (cf. LigneRow côté Structure).
 * Le rendu de chaque ligne reste délégué à l'appelant, qui garde ainsi le
 * contrôle de l'édition (Structure) ou de l'affichage statique (Admin).
 */
export function ExpenseReportLinesTable({
  lines,
  showIban,
  renderLine,
}: {
  lines: ExpenseReportLineDetail[];
  showIban: boolean;
  renderLine: (line: ExpenseReportLineDetail) => ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-md">
      <table className="table">
        <thead>
          <tr>
            <th>Bénéficiaire</th>
            {showIban && <th>IBAN</th>}
            <th>Nom de la dépense</th>
            <th>Type de dépense</th>
            <th>Montant</th>
            <th>Source</th>
            {!showIban && <th />}
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={LINE_COLUMN_COUNT} className="text-base-content/70">
                Aucune Ligne pour l&apos;instant.
              </td>
            </tr>
          ) : (
            lines.map(renderLine)
          )}
        </tbody>
      </table>
    </div>
  );
}
