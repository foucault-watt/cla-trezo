"use client";

import { History, Search, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";
import type { ExpenseReportOverview } from "@/lib/expense-reports/expense-reports";
import { expenseReportStatusLabel } from "@/lib/expense-reports/labels";
import {
  groupByYear,
  splitRecentAndHistorique,
  type YearGroup,
} from "@/lib/year-grouping";
import { formatCents } from "@/lib/money";
import { pluralize } from "@/lib/plural";
import { ExpenseReportRow } from "./expense-report-row";

const STATUS_ORDER: ExpenseReportStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "TAKEN_OVER",
  "FINALIZED",
  "REJECTED",
];

function matches(report: ExpenseReportOverview, q: string) {
  if (!q) return true;
  const haystack = [
    report.title,
    report.description ?? "",
    report.beneficiaryFirstname ?? "",
    report.beneficiaryLastname ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function YearSection({
  assoSlug,
  group,
}: {
  assoSlug: string;
  group: YearGroup<ExpenseReportOverview>;
}) {
  return (
    <section className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-md">
      <div className="flex items-center gap-3 border-b border-base-300 bg-base-200/50 px-4 py-2">
        <span className="text-base font-semibold">{group.year}</span>
        <span className="text-sm text-base-content/60">
          {pluralize(group.items.length, "note")}
        </span>
        <span className="ml-auto text-sm text-base-content/70">
          {formatCents(group.totalCents)}
        </span>
      </div>
      {group.items.map((report, i) => (
        <ExpenseReportRow
          key={report.id}
          assoSlug={assoSlug}
          report={report}
          striped={i % 2 === 1}
        />
      ))}
    </section>
  );
}

/**
 * Liste des Notes de frais groupée par année (sous-total inclus), avec une
 * barre de recherche/statut/tri `sticky` en haut du contenu — utile dès que
 * la liste s'étale sur plusieurs sections d'année et qu'on scroll loin du
 * haut de page. Seules l'année en cours et la précédente sont dépliées ;
 * le reste apparaît d'un coup derrière un bouton "Historique".
 */
export function ExpenseReportsList({
  assoSlug,
  reports,
}: {
  assoSlug: string;
  reports: ExpenseReportOverview[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ExpenseReportStatus | "ALL">("ALL");
  const [showHistorique, setShowHistorique] = useState(false);

  const { recent, historique, cutoffYear } = useMemo(
    () => splitRecentAndHistorique(reports, (r) => r.createdAt),
    [reports],
  );

  const applyFilters = useCallback(
    (list: ExpenseReportOverview[]) => {
      const q = query.trim().toLowerCase();
      return list.filter(
        (r) => (status === "ALL" || r.status === status) && matches(r, q),
      );
    },
    [query, status],
  );

  const recentGroups = useMemo(
    () =>
      groupByYear(
        applyFilters(recent),
        (r) => r.createdAt,
        (r) => r.totalAmountCents,
      ),
    [recent, applyFilters],
  );
  const historiqueGroups = useMemo(
    () =>
      groupByYear(
        applyFilters(historique),
        (r) => r.createdAt,
        (r) => r.totalAmountCents,
      ),
    [historique, applyFilters],
  );
  const historiqueCount = historiqueGroups.reduce(
    (sum, g) => sum + g.items.length,
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
            placeholder="Rechercher un titre, un bénéficiaire…"
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
            <YearSection key={group.year} assoSlug={assoSlug} group={group} />
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
                  <YearSection
                    key={group.year}
                    assoSlug={assoSlug}
                    group={group}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
