import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import { formatCents } from "@/lib/money";

export function ListView({
  subventions,
}: {
  subventions: VisibleSubvention[];
}) {
  return (
    <div className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-md">
      {subventions.map((subvention, i) => (
        <div
          key={subvention.id}
          className={`flex items-center gap-3 px-4 py-2.5 ${
            i % 2 === 1 ? "bg-base-200/60" : ""
          }`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{subvention.reason}</span>
              <span className="badge badge-neutral shrink-0">
                {subventionTypeLabel[subvention.type]}
              </span>
            </div>
            <div className="truncate text-xs text-base-content/60">
              {subvention.campaignName}
            </div>
          </div>
          <div className="hidden w-28 shrink-0 text-right text-sm text-base-content/70 sm:block">
            {formatCents(subvention.totalAmountCents)}
          </div>
          <div className="hidden w-28 shrink-0 text-right text-sm text-base-content/70 sm:block">
            {formatCents(subvention.usedAmountCents)}
          </div>
          <div className="w-28 shrink-0 text-right font-medium">
            {formatCents(subvention.remainingAmountCents)}
          </div>
        </div>
      ))}
    </div>
  );
}
