import Link from "next/link";
import type { SubventionCampaignOverview } from "@/lib/admin/subvention-campaigns";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import {
  campaignStatusBadgeClass,
  campaignStatusDotClass,
  campaignStatusLabel,
} from "@/lib/subventions/status";
import { formatShortDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";

/**
 * Ligne dense pour la liste Admin des Campagnes de subvention — même forme
 * que `AdminExpenseReportRow` (pastille de statut en tête, badge texte en
 * fin, cf. règle "Status/badge placement" de docs/design/COMPONENTS.md), pour
 * garder un seul vocabulaire de liste dense dans tout le produit.
 */
export function CampaignRow({
  campaign,
  striped = false,
}: {
  campaign: SubventionCampaignOverview;
  striped?: boolean;
}) {
  return (
    <Link
      href={`/app/admin/subventions/${campaign.id}`}
      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-base-300/40 ${
        striped ? "bg-base-200/60" : ""
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
      </div>
      <div className="hidden w-24 shrink-0 text-right text-xs text-base-content/60 lg:block">
        {formatShortDate(campaign.date)}
      </div>
      <div className="hidden w-28 shrink-0 text-right text-sm text-base-content/70 sm:block">
        {campaign.subventionsCount} subv.
      </div>
      <div className="w-28 shrink-0 text-right text-sm text-base-content/70">
        {formatCents(campaign.totalAmountCents)}
      </div>
      <div className="flex w-32 shrink-0 justify-end">
        <span className={`badge ${campaignStatusBadgeClass[campaign.status]}`}>
          {campaignStatusLabel[campaign.status]}
        </span>
      </div>
    </Link>
  );
}
