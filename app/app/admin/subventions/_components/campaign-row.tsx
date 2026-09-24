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
import { pluralize } from "@/lib/plural";

/**
 * Ligne dense pour la liste Admin des Campagnes de subvention — même forme
 * que `AdminExpenseReportRow` (pastille de statut en tête, badge texte en
 * fin, cf. règle "Status/badge placement" de docs/design/COMPONENTS.md), pour
 * garder un seul vocabulaire de liste dense dans tout le produit. Comme les
 * autres listes denses, la grille à largeurs fixes n'a plus la place sous
 * `sm` : on bascule sur une carte empilée pour éviter le chevauchement.
 */
export function CampaignRow({
  campaign,
  striped = false,
}: {
  campaign: SubventionCampaignOverview;
  striped?: boolean;
}) {
  const href = `/app/admin/subventions/${campaign.id}`;
  const rowBg = striped ? "bg-base-200/60" : "";
  const title = `${subventionTypeLabel[campaign.type]} ${campaign.name}`;

  return (
    <>
      <Link
        href={href}
        className={`flex flex-col gap-1 px-4 py-2.5 hover:bg-base-300/40 sm:hidden ${rowBg}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`size-2.5 shrink-0 rounded-full ${campaignStatusDotClass[campaign.status]}`}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
          <span
            className={`badge badge-sm shrink-0 ${campaignStatusBadgeClass[campaign.status]}`}
          >
            {campaignStatusLabel[campaign.status]}
          </span>
        </div>
        <div className="flex items-center justify-between pl-[1.125rem] text-xs text-base-content/60">
          <span>{pluralize(campaign.subventionsCount, "subvention")}</span>
          <span className="font-medium text-base-content/70">
            {formatCents(campaign.totalAmountCents)}
          </span>
        </div>
      </Link>

      <Link
        href={href}
        className={`hidden items-center gap-3 px-4 py-2.5 hover:bg-base-300/40 sm:flex ${rowBg}`}
      >
        <span
          className={`size-2.5 shrink-0 rounded-full ${campaignStatusDotClass[campaign.status]}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <span className="truncate font-medium">{title}</span>
        </div>
        <div className="hidden w-24 shrink-0 text-right text-xs text-base-content/60 lg:block">
          {formatShortDate(campaign.date)}
        </div>
        <div className="hidden w-28 shrink-0 whitespace-nowrap text-right text-sm text-base-content/70 sm:block">
          {pluralize(campaign.subventionsCount, "subvention")}
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
    </>
  );
}
