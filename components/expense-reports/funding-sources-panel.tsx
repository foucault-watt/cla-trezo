"use client";

import { Check, TriangleAlert } from "lucide-react";
import { formatCents } from "@/lib/money";
import type { AssoType } from "@/app/generated/prisma/enums";
import type { SoldeView } from "@/lib/solde/solde";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";
import { useSubventionSelectionTarget } from "./subvention-selection-context";

export function FundingSourcesPanel({
  assoType,
  soldeView,
  visibleSubventions,
}: {
  assoType: AssoType | null;
  soldeView: SoldeView;
  visibleSubventions: VisibleSubvention[];
}) {
  const target = useSubventionSelectionTarget();

  return (
    <div className="flex flex-col gap-4">
      {assoType === "CLUB" && soldeView.status === "ready" && (
        <div className="card border border-base-300 bg-base-100 shadow-md">
          <div className="card-body gap-2 p-4">
            <span className="text-xs font-medium text-base-content/60">
              Solde du Club
            </span>
            <span
              className={`text-2xl font-semibold ${soldeView.balanceCents < 0 ? "text-error" : ""}`}
            >
              {formatCents(soldeView.balanceCents)}
            </span>
            {soldeView.movements.length > 0 && (
              <div className="collapse-arrow collapse mt-2 border border-base-300 bg-base-200">
                <input type="checkbox" />
                <div className="collapse-title min-h-0 px-3 py-2 text-xs font-medium">
                  Historique ({soldeView.movements.length})
                </div>
                <div className="collapse-content px-3">
                  <ul className="flex flex-col gap-1 text-xs">
                    {soldeView.movements.slice(0, 5).map((m) => (
                      <li key={m.id} className="flex justify-between gap-2">
                        <span className="text-base-content/70">
                          {m.description ?? m.category ?? "Mouvement"}
                        </span>
                        <span
                          className={
                            m.movementType === "CREDIT"
                              ? "text-success"
                              : "text-error"
                          }
                        >
                          {m.movementType === "CREDIT" ? "+" : "-"}
                          {formatCents(m.amountCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium text-base-content/60">
          Subventions disponibles
        </span>
        {target && (
          <div role="status" className="alert alert-info alert-soft text-xs">
            <span>
              Cliquez sur une Subvention ci-dessous pour l&apos;utiliser comme
              source de financement.
            </span>
          </div>
        )}
        {visibleSubventions.length === 0 ? (
          <p className="text-xs text-base-content/50">
            Aucune Subvention Publiée pour cette association.
          </p>
        ) : (
          visibleSubventions.map((s) => {
            const selected = target?.selectedId === s.id;
            const clickable = target !== null;
            return (
              <div
                key={s.id}
                className={`card border-2 transition-all duration-150 ${
                  selected
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : s.stale
                      ? "border-error/50 hover:border-error"
                      : clickable
                        ? "border-base-300 hover:border-primary/50"
                        : "border-base-300"
                }`}
              >
                <div className="card-body gap-1 p-4">
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={
                      clickable ? () => target.onSelect(s.id) : undefined
                    }
                    className="flex w-full flex-col items-start gap-1 text-left disabled:cursor-default"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="font-medium">{s.reason}</span>
                      {selected && (
                        <span className="badge badge-primary badge-sm gap-1">
                          <Check className="size-3" />
                          Choisie
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-lg font-semibold ${s.stale ? "text-error" : "text-success"}`}
                    >
                      reste {formatCents(s.remainingAmountCents)}
                    </span>
                    <progress
                      className={`progress w-full ${s.stale ? "progress-error" : "progress-success"}`}
                      value={s.remainingAmountCents}
                      max={s.totalAmountCents}
                    />
                    {s.stale && (
                      <span className="flex items-center gap-1 text-xs text-error">
                        <TriangleAlert className="size-3.5 shrink-0" />
                        Subvention ancienne — risque de refus par l&apos;Admin.
                      </span>
                    )}
                  </button>
                  {s.commentary && (
                    <div className="collapse-arrow collapse mt-1 border border-base-300 bg-base-200">
                      <input type="checkbox" />
                      <div className="collapse-title min-h-0 px-3 py-2 text-xs font-medium">
                        Détail
                      </div>
                      <div className="collapse-content px-3 text-xs text-base-content/70">
                        {s.commentary}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
