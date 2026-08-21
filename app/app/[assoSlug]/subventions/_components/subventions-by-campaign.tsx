import { TriangleAlert } from "lucide-react";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import { formatCents } from "@/lib/money";

function groupByCampaign(subventions: VisibleSubvention[]) {
  const groups = new Map<
    string,
    {
      campaignId: string;
      campaignName: string;
      campaignDate: Date;
      type: VisibleSubvention["type"];
      stale: boolean;
      subventions: VisibleSubvention[];
    }
  >();

  for (const subvention of subventions) {
    const current = groups.get(subvention.campaignId);
    if (current) {
      current.subventions.push(subvention);
    } else {
      groups.set(subvention.campaignId, {
        campaignId: subvention.campaignId,
        campaignName: subvention.campaignName,
        campaignDate: subvention.campaignDate,
        type: subvention.type,
        stale: subvention.stale,
        subventions: [subvention],
      });
    }
  }

  return Array.from(groups.values());
}

export function SubventionsByCampaign({
  subventions,
}: {
  subventions: VisibleSubvention[];
}) {
  const campaigns = groupByCampaign(subventions);

  return (
    <div className="flex flex-col gap-9">
      {campaigns.map((campaign) => (
        <section key={campaign.campaignId}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="badge badge-primary">
                {subventionTypeLabel[campaign.type]}
              </span>
              <h2 className="text-base font-semibold">
                {campaign.campaignName}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {campaign.stale && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-error">
                  <TriangleAlert size={14} />
                  Campagne ancienne
                </span>
              )}
              <span className="text-sm text-base-content/60">
                {campaign.campaignDate.toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
          <div className="mb-4 border-b border-base-300" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campaign.subventions.map((subvention) => (
              <SubventionCard key={subvention.id} subvention={subvention} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SubventionCard({ subvention }: { subvention: VisibleSubvention }) {
  return (
    <div className="card border border-base-300 bg-base-100 shadow-md">
      <div className="card-body gap-2 p-4">
        <span className="font-medium">{subvention.reason}</span>
        <span
          className={`text-xl font-semibold ${subvention.stale ? "text-error" : "text-success"}`}
        >
          reste {formatCents(subvention.remainingAmountCents)}
        </span>
        <progress
          className={`progress w-full ${subvention.stale ? "progress-error" : "progress-success"}`}
          value={subvention.remainingAmountCents}
          max={subvention.totalAmountCents}
        />
        <span className="text-xs text-base-content/60">
          {formatCents(subvention.usedAmountCents)} utilisés sur{" "}
          {formatCents(subvention.totalAmountCents)}
        </span>
        {subvention.stale && (
          <span className="flex items-start gap-1.5 text-xs text-error">
            <TriangleAlert size={13} className="mt-0.5 shrink-0" />
            Subvention ancienne — risque de refus par l&apos;Admin.
          </span>
        )}
        {subvention.commentary && (
          <p className="text-xs italic text-base-content/70">
            {subvention.commentary}
          </p>
        )}
      </div>
    </div>
  );
}
