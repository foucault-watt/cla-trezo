import Link from "next/link";
import type { SubventionCampaignOverview } from "@/lib/admin/subvention-campaigns";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import {
  campaignStatusBadgeClass,
  campaignStatusDotClass,
  campaignStatusLabel,
} from "@/lib/subventions/status";
import { formatCents } from "@/lib/money";

export function CampaignsListView({
  campaigns,
}: {
  campaigns: SubventionCampaignOverview[];
}) {
  return (
    <div className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-md">
      {campaigns.map((campaign, i) => (
        <Link
          key={campaign.id}
          href={`/app/admin/subventions/${campaign.id}`}
          className={`flex items-center gap-3 px-4 py-2.5 hover:bg-base-300/40 ${
            i % 2 === 1 ? "bg-base-200/60" : ""
          }`}
        >
          <span
            className={`size-2.5 shrink-0 rounded-full ${campaignStatusDotClass[campaign.status]}`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <span className="truncate font-medium">
              {subventionTypeLabel[campaign.type]} {campaign.name}
            </span>
            <div className="truncate text-xs text-base-content/60 sm:hidden">
              {campaign.subventionsCount} subvention(s) ·{" "}
              {formatCents(campaign.totalAmountCents)}
            </div>
          </div>
          <div className="hidden w-24 shrink-0 text-right text-sm text-base-content/70 sm:block">
            {campaign.date.toLocaleDateString("fr-FR")}
          </div>
          <div className="hidden w-28 shrink-0 text-right text-sm text-base-content/70 sm:block">
            {campaign.subventionsCount} subv.
          </div>
          <div className="hidden w-28 shrink-0 text-right text-sm text-base-content/70 sm:block">
            {formatCents(campaign.totalAmountCents)}
          </div>
          <span
            className={`badge shrink-0 ${campaignStatusBadgeClass[campaign.status]}`}
          >
            {campaignStatusLabel[campaign.status]}
          </span>
        </Link>
      ))}
    </div>
  );
}
