"use client";

import { ArrowDownUp, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  assoStatusLabel,
  assoTypeDisplayLabel,
  assoTypeLabel,
} from "@/lib/admin/asso-labels";
import type { AssoOverview } from "@/lib/admin/associations";
import type { AssoStatus, AssoType } from "@/app/generated/prisma/enums";
import { AssociationRow } from "./association-row";

const STATUS_ORDER: AssoStatus[] = ["ACTIVE", "INACTIVE", "ARCHIVED"];
const TYPE_ORDER = Object.keys(assoTypeLabel) as AssoType[];

type SortKey = "NAME" | "ACTIVITY" | "SOLDE_DESC" | "SOLDE_ASC";

const SORT_LABEL: Record<SortKey, string> = {
  NAME: "Nom (A → Z)",
  ACTIVITY: "Activité récente",
  SOLDE_DESC: "Solde décroissant",
  SOLDE_ASC: "Solde croissant",
};

// Les Assos sans Solde chiffré passent toujours en dernier.
function soldeOf(a: AssoOverview) {
  return a.solde.status === "ready" ? a.solde.balanceCents : null;
}

function compare(sort: SortKey) {
  return (a: AssoOverview, b: AssoOverview) => {
    const byName = a.name.localeCompare(b.name, "fr");
    if (sort === "NAME") return byName;
    if (sort === "ACTIVITY") {
      const ta = a.lastActivityAt?.getTime() ?? -Infinity;
      const tb = b.lastActivityAt?.getTime() ?? -Infinity;
      return tb === ta ? byName : tb > ta ? 1 : -1;
    }
    const sa = soldeOf(a);
    const sb = soldeOf(b);
    if (sa === null || sb === null) {
      return sa === sb ? byName : sa === null ? 1 : -1;
    }
    return sa === sb ? byName : sort === "SOLDE_DESC" ? sb - sa : sa - sb;
  };
}

function matches(asso: AssoOverview, q: string) {
  if (!q) return true;
  const haystack = [asso.name, assoTypeDisplayLabel(asso.type)]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/**
 * Liste Admin des Assos — même barre `sticky` recherche/filtres que la liste
 * des Campagnes de subvention (nom + Type + Statut).
 */
export function AssociationsList({
  associations,
}: {
  associations: AssoOverview[];
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
        (type === "ALL" || (type === "NONE" ? a.type === null : a.type === type)) &&
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
            <AssociationRow key={asso.id} asso={asso} striped={i % 2 === 1} />
          ))}
        </div>
      )}
    </div>
  );
}
