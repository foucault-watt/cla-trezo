"use client";

import { ArrowDownUp, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  assoStatusLabel,
  assoTypeDisplayLabel,
  assoTypeLabel,
} from "@/lib/admin/asso-labels";
import type { AssoStorageOverview } from "@/lib/admin/storage";
import type { AssoStatus, AssoType } from "@/app/generated/prisma/enums";
import { pluralize } from "@/lib/plural";
import { StorageArchiveButton } from "./storage-archive-button";

const STATUS_ORDER: AssoStatus[] = ["ACTIVE", "INACTIVE", "ARCHIVED"];
const TYPE_ORDER = Object.keys(assoTypeLabel) as AssoType[];

type SortKey = "NAME" | "FILES_DESC" | "FILES_ASC" | "RECENT";

const SORT_LABEL: Record<SortKey, string> = {
  NAME: "Nom (A → Z)",
  FILES_DESC: "Fichiers décroissant",
  FILES_ASC: "Fichiers croissant",
  RECENT: "Année la plus récente",
};

function filesOf(a: AssoStorageOverview) {
  return a.supportingDocumentsCount + a.pdfsCount;
}

function compare(sort: SortKey) {
  return (a: AssoStorageOverview, b: AssoStorageOverview) => {
    const byName = a.name.localeCompare(b.name, "fr");
    if (sort === "NAME") return byName;
    if (sort === "RECENT") {
      // Les Assos sans fichier passent toujours en dernier.
      const ya = a.yearsSpan?.max ?? -Infinity;
      const yb = b.yearsSpan?.max ?? -Infinity;
      return yb === ya ? byName : yb > ya ? 1 : -1;
    }
    const fa = filesOf(a);
    const fb = filesOf(b);
    return fa === fb ? byName : sort === "FILES_DESC" ? fb - fa : fa - fb;
  };
}

function matches(asso: AssoStorageOverview, q: string) {
  if (!q) return true;
  const haystack = [asso.name, assoTypeDisplayLabel(asso.type)]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/**
 * Liste Admin du Stockage — même barre `sticky` recherche/filtres/tri que la
 * liste des Assos (nom + Type + Statut).
 */
export function StorageList({
  associations,
}: {
  associations: AssoStorageOverview[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AssoStatus | "ALL">("ALL");
  const [type, setType] = useState<AssoType | "NONE" | "ALL">("ALL");

  const [sort, setSort] = useState<SortKey>("NAME");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return associations
      .filter(
        (a) =>
          (status === "ALL" || a.status === status) &&
          (type === "ALL" ||
            (type === "NONE" ? a.type === null : a.type === type)) &&
          matches(a, q),
      )
      .sort(compare(sort));
  }, [associations, query, status, type, sort]);

  const hasActiveFilter = query !== "" || status !== "ALL" || type !== "ALL";

  function reset() {
    setQuery("");
    setStatus("ALL");
    setType("ALL");
  }

  return (
    <div>
      <div className="sticky top-0 z-10 mb-3 flex flex-col gap-2 rounded-box border border-base-300 bg-base-100 p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        <label className="input input-sm w-full sm:max-w-xs">
          <Search size={16} className="opacity-60" />
          <input
            type="search"
            className="grow"
            placeholder="Rechercher une Asso…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <select
          className="select select-sm w-full sm:w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value as AssoStatus | "ALL")}
        >
          <option value="ALL">Tous les statuts</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {assoStatusLabel[s]}
            </option>
          ))}
        </select>

        <select
          className="select select-sm w-full sm:w-auto"
          value={type}
          onChange={(e) => setType(e.target.value as AssoType | "NONE" | "ALL")}
        >
          <option value="ALL">Tous les types</option>
          {TYPE_ORDER.map((t) => (
            <option key={t} value={t}>
              {assoTypeLabel[t]}
            </option>
          ))}
          <option value="NONE">{assoTypeDisplayLabel(null)}</option>
        </select>

        <label className="select select-sm w-full sm:w-auto">
          <ArrowDownUp size={16} className="opacity-60" aria-hidden />
          <select
            aria-label="Trier par"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
        </label>

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

      {filtered.length === 0 ? (
        <div className="rounded-box border border-base-300 bg-base-100 p-8 text-center text-sm text-base-content/70 shadow-md">
          Aucune Asso ne correspond à ces critères.
        </div>
      ) : (
        <div className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-md">
          {filtered.map((asso, i) => (
            <StorageRow key={asso.id} asso={asso} striped={i % 2 === 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function StorageRow({
  asso,
  striped,
}: {
  asso: AssoStorageOverview;
  striped: boolean;
}) {
  const hasFiles = asso.reportsWithFilesCount > 0;

  return (
    <div
      className={`flex flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center ${
        striped ? "bg-base-200/60" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{asso.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-base-content/60">
          <span className="badge badge-sm badge-ghost">
            {pluralize(asso.supportingDocumentsCount, "justificatif")}
          </span>
          <span className="badge badge-sm badge-ghost">
            {asso.pdfsCount} PDF
          </span>
          {asso.yearsSpan && (
            <span>
              {asso.yearsSpan.min === asso.yearsSpan.max
                ? asso.yearsSpan.min
                : `${asso.yearsSpan.min} – ${asso.yearsSpan.max}`}
            </span>
          )}
        </div>
      </div>

      {hasFiles ? (
        <StorageArchiveButton assoSlug={asso.slug} assoName={asso.name} />
      ) : (
        <span className="shrink-0 text-xs text-base-content/50">
          Aucun fichier
        </span>
      )}
    </div>
  );
}
