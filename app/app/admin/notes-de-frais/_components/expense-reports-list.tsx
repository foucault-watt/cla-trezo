"use client";

import { History, Search, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";
import type { ExpenseReportOverviewForAdmin } from "@/lib/admin/expense-reports";
import { expenseReportStatusLabel } from "@/lib/expense-reports/labels";
import {
  groupByYear,
  splitRecentAndHistorique,
  type YearGroup,
} from "@/lib/expense-reports/report-grouping";
import { formatCents } from "@/lib/money";
import { AdminExpenseReportRow } from "./expense-report-row";

// Une Note n'atteint la liste Admin qu'une fois soumise (cf.
// listExpenseReportsForAdmin) : jamais de Brouillon ici.
const STATUS_ORDER: ExpenseReportStatus[] = [
  "SUBMITTED",
  "TAKEN_OVER",
  "FINALIZED",
  "REJECTED",
];

function matches(report: ExpenseReportOverviewForAdmin, q: string) {
  if (!q) return true;
  const haystack = [
    report.title,
    report.assoName,
    report.beneficiaryFirstname ?? "",
    report.beneficiaryLastname ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function YearSection({ group }: { group: YearGroup<ExpenseReportOverviewForAdmin> }) {
  return (
    <section className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-md">
      <div className="flex items-center gap-3 border-b border-base-300 bg-base-200/50 px-4 py-2">
        <span className="text-base font-semibold">{group.year}</span>
        <span className="text-sm text-base-content/60">
          {group.reports.length} note(s)
        </span>
        <span className="ml-auto text-sm text-base-content/70">
          {formatCents(group.totalCents)}
        </span>
      </div>
      {group.reports.map((report, i) => (
        <AdminExpenseReportRow
          key={report.id}
          report={report}
          striped={i % 2 === 1}
        />
      ))}
    </section>
  );
}

/**
 * Liste Admin des Notes de frais — même logique que la liste côté Structure
 * (`expense-reports-list.tsx` dans `[assoSlug]/notes-de-frais`) pour
 * homogénéiser le site : groupée par année avec sous-total, barre
 * recherche/statut `sticky`, année en cours + précédente dépliées, le reste
 * derrière un bouton "Historique" qui reste filtré/compté comme le contenu
 * visible.
 */
export function AdminExpenseReportsList({
  reports,
}: {
  reports: ExpenseReportOverviewForAdmin[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ExpenseReportStatus | "ALL">("ALL");
  const [showHistorique, setShowHistorique] = useState(false);

  const { recent, historique, cutoffYear } = useMemo(
    () => splitRecentAndHistorique(reports),
    [reports],
  );

  const applyFilters = useCallback(
    (list: ExpenseReportOverviewForAdmin[]) => {
      const q = query.trim().toLowerCase();
      return list.filter(
        (r) => (status === "ALL" || r.status === status) && matches(r, q),
      );
    },
    [query, status],
  );

  const recentGroups = useMemo(
    () => groupByYear(applyFilters(recent)),
    [recent, applyFilters],
  );
  const historiqueGroups = useMemo(
    () => groupByYear(applyFilters(historique)),
    [historique, applyFilters],
  );
  const historiqueCount = historiqueGroups.reduce(
    (sum, g) => sum + g.reports.length,
    0,
  );

  const hasActiveFilter = query !== "" || status !== "ALL";

  function reset() {
    setQuery("");
    setStatus("ALL");
  }

  return (
    <div>
      <div className="sticky top-0 z-10 mb-3 flex flex-col gap-2 rounded-box border border-base-300 bg-base-100 p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        <label className="input input-sm w-full sm:max-w-xs">
          <Search size={16} className="opacity-60" />
          <input
            type="search"
            className="grow"
            placeholder="Rechercher un titre, une Asso, un bénéficiaire…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <select
          className="select select-sm w-full sm:w-auto"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as ExpenseReportStatus | "ALL")
          }
        >
          <option value="ALL">Tous les statuts</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {expenseReportStatusLabel[s]}
            </option>
          ))}
        </select>

        {hasActiveFilter && (
          <button
            type="button"
            className="btn btn-ghost btn-sm sm:ml-auto"
            onClick={reset}
          >
            <X size={16} />
            Réinitialiser
          </button>
        )}
      </div>

      {recentGroups.length === 0 ? (
        <div className="rounded-box border border-base-300 bg-base-100 p-8 text-center text-sm text-base-content/70 shadow-md">
          Aucune Note de frais ne correspond à ces critères depuis {cutoffYear}.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recentGroups.map((group) => (
            <YearSection key={group.year} group={group} />
          ))}
        </div>
      )}

      {historique.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            className="btn btn-outline btn-sm w-full sm:w-auto"
            onClick={() => setShowHistorique((v) => !v)}
          >
            <History size={16} />
            {showHistorique
              ? "Masquer l'historique"
              : `Historique — avant ${cutoffYear} (${historiqueCount})`}
          </button>

          {showHistorique && (
            <div className="mt-3 flex flex-col gap-3">
              {historiqueGroups.length === 0 ? (
                <p className="text-sm text-base-content/60">
                  Aucune Note de frais archivée ne correspond à ces critères.
                </p>
              ) : (
                historiqueGroups.map((group) => (
                  <YearSection key={group.year} group={group} />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
