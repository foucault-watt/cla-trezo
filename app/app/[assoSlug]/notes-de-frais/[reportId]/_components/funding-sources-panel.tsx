import { formatCents } from "@/lib/money";
import type { AssoType } from "@/app/generated/prisma/enums";
import type { SoldeView } from "@/lib/solde/solde";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";

export function FundingSourcesPanel({
  assoType,
  soldeView,
  visibleSubventions,
}: {
  assoType: AssoType | null;
  soldeView: SoldeView;
  visibleSubventions: VisibleSubvention[];
}) {
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
                            m.movementType === "CREDIT" ? "text-success" : "text-error"
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
        {visibleSubventions.length === 0 ? (
          <p className="text-xs text-base-content/50">
            Aucune Subvention Publiée pour cette Structure.
          </p>
        ) : (
          visibleSubventions.map((s) => (
            <div key={s.id} className="card border border-base-300 bg-base-100 shadow-md">
              <div className="card-body gap-1 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.reason}</span>
                  <span className="badge badge-ghost badge-sm">{s.type}</span>
                </div>
                <span className="text-lg font-semibold text-success">
                  reste {formatCents(s.remainingAmountCents)}
                </span>
                <progress
                  className="progress progress-success w-full"
                  value={s.remainingAmountCents}
                  max={s.totalAmountCents}
                />
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
          ))
        )}
      </div>
    </div>
  );
}
