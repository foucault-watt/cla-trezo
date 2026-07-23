import Link from "next/link";
import type { SubventionCampaignOverview } from "@/lib/admin/subvention-campaigns";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import {
  campaignStatusBadgeClass,
  campaignStatusLabel,
} from "@/lib/subventions/status";
import { formatCents } from "@/lib/money";

export function CampaignsGridView({
  campaigns,
}: {
  campaigns: SubventionCampaignOverview[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="card border border-base-300 bg-base-100 shadow-md"
        >
          <div className="card-body">
            <div className="flex items-start justify-between gap-2">
              <h2 className="card-title text-base">
                {subventionTypeLabel[campaign.type]} {campaign.name}
              </h2>
              <span
                className={`badge shrink-0 ${campaignStatusBadgeClass[campaign.status]}`}
              >
                {campaignStatusLabel[campaign.status]}
              </span>
            </div>
            <p className="text-sm text-base-content/70">
              {campaign.date.toLocaleDateString("fr-FR")}
            </p>
            <p className="text-2xl">{formatCents(campaign.totalAmountCents)}</p>
            <p className="text-sm text-base-content/70">
              {campaign.subventionsCount} Subvention(s)
            </p>
            <div className="card-actions justify-end">
              <Link
                href={`/app/admin/subventions/${campaign.id}`}
                className="btn btn-sm"
              >
                Voir le détail
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
