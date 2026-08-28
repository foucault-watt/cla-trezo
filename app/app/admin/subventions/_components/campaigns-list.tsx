"use client";

import { History, Search, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { SubventionCampaignOverview } from "@/lib/admin/subvention-campaigns";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import { campaignStatusLabel, type CampaignStatus } from "@/lib/subventions/status";
import { groupByYear, splitRecentAndHistorique, type YearGroup } from "@/lib/year-grouping";
import { formatCents } from "@/lib/money";
import { CampaignRow } from "./campaign-row";

const STATUS_ORDER: CampaignStatus[] = ["PROGRAMMEE", "PUBLIEE"];

function matches(campaign: SubventionCampaignOverview, q: string) {
  if (!q) return true;
  const haystack = [campaign.name, subventionTypeLabel[campaign.type]]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function YearSection({ group }: { group: YearGroup<SubventionCampaignOverview> }) {
  return (
    <section className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-md">
      <div className="flex items-center gap-3 border-b border-base-300 bg-base-200/50 px-4 py-2">
        <span className="text-base font-semibold">{group.year}</span>
        <span className="text-sm text-base-content/60">
          {group.items.length} campagne(s)
        </span>
        <span className="ml-auto text-sm text-base-content/70">
          {formatCents(group.totalCents)}
        </span>
      </div>
      {group.items.map((campaign, i) => (
        <CampaignRow key={campaign.id} campaign={campaign} striped={i % 2 === 1} />
      ))}
    </section>
  );
}

/**
 * Liste Admin des Campagnes de subvention — même logique que les listes de
 * Notes de frais (Structure et Admin) pour homogénéiser le site : groupée
 * par année avec sous-total, barre recherche/statut `sticky`, année en cours
 * + précédente dépliées, le reste derrière un bouton "Historique" qui reste
 * filtré/compté comme le contenu visible.
 */
export function CampaignsList({
  campaigns,
}: {
  campaigns: SubventionCampaignOverview[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CampaignStatus | "ALL">("ALL");
  const [showHistorique, setShowHistorique] = useState(false);

  const { recent, historique, cutoffYear } = useMemo(
    () => splitRecentAndHistorique(campaigns, (c) => c.date),
    [campaigns],
  );

  const applyFilters = useCallback(
    (list: SubventionCampaignOverview[]) => {
      const q = query.trim().toLowerCase();
      return list.filter(
        (c) => (status === "ALL" || c.status === status) && matches(c, q),
      );
    },
    [query, status],
  );

  const recentGroups = useMemo(
    () =>
      groupByYear(
        applyFilters(recent),
        (c) => c.date,
        (c) => c.totalAmountCents,
      ),
    [recent, applyFilters],
  );
  const historiqueGroups = useMemo(
    () =>
      groupByYear(
        applyFilters(historique),
        (c) => c.date,
        (c) => c.totalAmountCents,
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
            placeholder="Rechercher une Campagne…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <select
          className="select select-sm w-full sm:w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value as CampaignStatus | "ALL")}
        >
          <option value="ALL">Tous les statuts</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {campaignStatusLabel[s]}
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
          Aucune Campagne ne correspond à ces critères depuis {cutoffYear}.
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
                  Aucune Campagne archivée ne correspond à ces critères.
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
