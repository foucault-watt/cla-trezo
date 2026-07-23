import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import { formatCents } from "@/lib/money";

export function GridView({
  subventions,
}: {
  subventions: VisibleSubvention[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {subventions.map((subvention) => (
        <div
          key={subvention.id}
          className="card border border-base-300 bg-base-100 shadow-md"
        >
          <div className="card-body">
            <div className="flex items-center justify-between">
              <h2 className="card-title text-base">{subvention.reason}</h2>
              <span className="badge badge-neutral">
                {subventionTypeLabel[subvention.type]}
              </span>
            </div>
            <p className="text-sm text-base-content/70">
              {subvention.campaignName}
            </p>
            {subvention.commentary && (
              <p className="text-sm text-base-content/70">
                {subvention.commentary}
              </p>
            )}
            <div className="stats stats-vertical mt-2 bg-transparent sm:stats-horizontal">
              <div className="stat px-0 py-2">
                <div className="stat-title">Montant total</div>
                <div className="stat-value text-lg">
                  {formatCents(subvention.totalAmountCents)}
                </div>
              </div>
              <div className="stat px-0 py-2">
                <div className="stat-title">Montant utilisé</div>
                <div className="stat-value text-lg">
                  {formatCents(subvention.usedAmountCents)}
                </div>
              </div>
              <div className="stat px-0 py-2">
                <div className="stat-title">Montant restant</div>
                <div className="stat-value text-lg">
                  {formatCents(subvention.remainingAmountCents)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
