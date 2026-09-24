import { TriangleAlert } from "lucide-react";
import { formatCents } from "@/lib/money";
import { formatShortDate } from "@/lib/dates";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";
import {
  splitSubventionCampaignsByAge,
  type SubventionCampaignGroup,
} from "@/lib/subventions/subvention-campaigns";

/**
 * Onglet Subventions de la page Admin détail d'Asso : mêmes 3 bandes d'âge
 * que la page Structure (/subventions, cf. SubventionsLedger et
 * lib/subventions/subvention-campaigns.ts pour la logique partagée), mais
 * dans une présentation plus dense adaptée à un onglet plutôt qu'à une page
 * dédiée (pas de barres de progression desktop/mobile séparées).
 */
export function SubventionsTab({
  subventions,
}: {
  subventions: VisibleSubvention[];
}) {
  if (subventions.length === 0) {
    return (
      <p className="text-sm text-base-content/60">
        Aucune Subvention publiée pour l&apos;instant.
      </p>
    );
  }

  const bands = splitSubventionCampaignsByAge(subventions);

  return (
    <div className="space-y-3">
      {bands.recent.length > 0 ? (
        <div>
          <h3 className="mb-1 text-sm font-medium text-base-content/70">
            Campagnes récentes
          </h3>
          <div className="flex flex-col gap-3">
            {bands.recent.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-base-content/60">
          Aucune Subvention récente (moins d&apos;un an).
        </p>
      )}

      {bands.old.length > 0 && (
        <div className="collapse-arrow collapse border border-warning/30 bg-warning/5">
          <input type="checkbox" />
          <div className="collapse-title flex items-center gap-2 text-sm font-medium text-warning">
            <TriangleAlert size={14} aria-hidden="true" />
            Subventions anciennes ({bands.old.length})
          </div>
          <div className="collapse-content">
            <div className="flex flex-col gap-3">
              {bands.old.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} old />
              ))}
            </div>
          </div>
        </div>
      )}

      {bands.history.length > 0 && (
        <div className="collapse-arrow collapse border border-base-300">
          <input type="checkbox" />
          <div className="collapse-title text-sm font-medium text-base-content/70">
            Historique ({bands.history.length})
          </div>
          <div className="collapse-content">
            <ul className="flex flex-col divide-y divide-base-200">
              {bands.history.map((campaign) => (
                <li
                  key={campaign.id}
                  className="flex items-center justify-between py-1.5 text-sm text-base-content/70"
                >
                  <span>{campaign.name}</span>
                  <span>
                    {formatCents(campaign.usedAmountCents)} /{" "}
                    {formatCents(campaign.totalAmountCents)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignCard({
  campaign,
  old = false,
}: {
  campaign: SubventionCampaignGroup;
  old?: boolean;
}) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="badge badge-primary badge-sm">
            {subventionTypeLabel[campaign.type]}
          </span>
          <span className="text-sm font-semibold">{campaign.name}</span>
        </div>
        <span className="text-xs text-base-content/50">
          Publiée le {formatShortDate(campaign.publicationDate)}
        </span>
      </div>
      <ul className="mt-2 flex flex-col divide-y divide-base-200">
        {campaign.subventions.map((subvention) => (
          <li
            key={subvention.id}
            className="flex items-center justify-between py-1.5 text-sm"
          >
            <span className="text-base-content/75">{subvention.reason}</span>
            <span>
              {formatCents(subvention.usedAmountCents)} /{" "}
              {formatCents(subvention.totalAmountCents)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-1 flex justify-end text-xs">
        <span
          className={`font-medium ${old ? "text-warning-content" : "text-success"}`}
        >
          Restant : {formatCents(campaign.remainingAmountCents)}
        </span>
      </div>
    </div>
  );
}
