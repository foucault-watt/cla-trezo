"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";
import { listHistoricalSubventionsAction } from "@/lib/subventions/subvention-history-actions";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import { formatCents } from "@/lib/money";

type LoadState = "idle" | "loading" | "loaded" | "error";

export function HistoriqueSection({ assoSlug }: { assoSlug: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>("idle");
  const [subventions, setSubventions] = useState<VisibleSubvention[]>([]);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && state === "idle") {
      setState("loading");
      listHistoricalSubventionsAction(assoSlug)
        .then((result) => {
          setSubventions(result);
          setState("loaded");
        })
        .catch(() => setState("error"));
    }
  }

  return (
    <div className="collapse-arrow collapse mt-10 border border-base-300 bg-base-100">
      <input
        type="checkbox"
        checked={open}
        onChange={handleToggle}
        aria-label="Afficher l'historique des Subventions"
      />
      <div className="collapse-title font-medium">
        Historique
        <span className="ml-2 text-xs font-normal text-base-content/60">
          Subventions publiées il y a plus de 2 ans.
        </span>
      </div>
      <div className="collapse-content">
        {state === "loading" && (
          <p className="text-sm text-base-content/60">Chargement…</p>
        )}
        {state === "error" && (
          <p className="text-sm text-error">
            Impossible de charger l&apos;historique.
          </p>
        )}
        {state === "loaded" && subventions.length === 0 && (
          <p className="text-sm text-base-content/60">
            Aucune Subvention ancienne.
          </p>
        )}
        {state === "loaded" && subventions.length > 0 && (
          <ul className="flex flex-col divide-y divide-base-300">
            {subventions.map((subvention) => (
              <HistoriqueRow key={subvention.id} subvention={subvention} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function HistoriqueRow({ subvention }: { subvention: VisibleSubvention }) {
  return (
    <li className="flex flex-col gap-1 py-2.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{subvention.reason}</span>
            <span className="badge badge-primary badge-sm shrink-0">
              {subventionTypeLabel[subvention.type]}
            </span>
            {subvention.stale && (
              <TriangleAlert size={13} className="shrink-0 text-error" />
            )}
          </div>
          <div className="truncate text-xs text-base-content/60">
            {subvention.campaignName} ·{" "}
            {subvention.campaignDate.toLocaleDateString("fr-FR")}
          </div>
        </div>
        <span className="shrink-0 text-sm font-medium">
          {formatCents(subvention.remainingAmountCents)} restants
        </span>
      </div>
      {subvention.commentary && (
        <p className="text-xs italic text-base-content/70">
          {subvention.commentary}
        </p>
      )}
    </li>
  );
}
