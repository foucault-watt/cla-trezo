import { History, TriangleAlert } from "lucide-react";
import { formatCents } from "@/lib/money";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";

type AgeBand = "recent" | "old" | "history";

type Campaign = {
  id: string;
  name: string;
  type: VisibleSubvention["type"];
  publicationDate: Date;
  subventions: VisibleSubvention[];
  totalAmountCents: number;
  usedAmountCents: number;
  remainingAmountCents: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function getAgeBand(publicationDate: Date, now: Date): AgeBand {
  const ageInDays = (now.getTime() - publicationDate.getTime()) / DAY_MS;
  if (ageInDays <= 365) return "recent";
  if (ageInDays <= 730) return "old";
  return "history";
}

function groupByCampaign(subventions: VisibleSubvention[]): Campaign[] {
  const groups = new Map<string, Campaign>();

  for (const subvention of subventions) {
    const existing = groups.get(subvention.campaignId);
    if (existing) {
      existing.subventions.push(subvention);
      existing.totalAmountCents += subvention.totalAmountCents;
      existing.usedAmountCents += subvention.usedAmountCents;
      existing.remainingAmountCents += subvention.remainingAmountCents;
      continue;
    }

    groups.set(subvention.campaignId, {
      id: subvention.campaignId,
      name: subvention.campaignName,
      type: subvention.type,
      publicationDate: subvention.publicationDate,
      subventions: [subvention],
      totalAmountCents: subvention.totalAmountCents,
      usedAmountCents: subvention.usedAmountCents,
      remainingAmountCents: subvention.remainingAmountCents,
    });
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.publicationDate.getTime() - a.publicationDate.getTime(),
  );
}

function splitCampaigns(subventions: VisibleSubvention[]) {
  const now = new Date();
  const result: Record<AgeBand, Campaign[]> = {
    recent: [],
    old: [],
    history: [],
  };

  for (const campaign of groupByCampaign(subventions)) {
    result[getAgeBand(campaign.publicationDate, now)].push(campaign);
  }
  return result;
}

function pluralizeCampaign(count: number) {
  return `${count} campagne${count > 1 ? "s" : ""}`;
}

function progressValue(campaign: Campaign) {
  if (campaign.totalAmountCents <= 0) return 0;
  return Math.min(
    100,
    Math.max(0, (campaign.usedAmountCents / campaign.totalAmountCents) * 100),
  );
}

function PageHeading({ isDemo = false }: { isDemo?: boolean }) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-balance">
          Suivi des subventions
        </h1>
        {isDemo && (
          <span className="badge badge-outline badge-sm">
            Scénario de démonstration
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-base-content/70">
        Montants accordés, utilisés et restants par campagne.
      </p>
    </header>
  );
}

function CampaignIdentity({ campaign }: { campaign: Campaign }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge badge-primary badge-sm">
          {subventionTypeLabel[campaign.type]}
        </span>
        <h3 className="text-base font-semibold text-balance">
          {campaign.name}
        </h3>
      </div>
    </div>
  );
}

function DesktopCampaignList({
  campaigns,
  old = false,
}: {
  campaigns: Campaign[];
  old?: boolean;
}) {
  if (campaigns.length === 0) {
    return (
      <p className="hidden rounded-box border border-dashed border-base-300 bg-base-100 px-5 py-8 text-center text-sm text-base-content/60 md:block">
        Aucune campagne dans cette période.
      </p>
    );
  }

  return (
    <div className="hidden space-y-4 md:block">
      {campaigns.map((campaign) => (
        <article
          className="overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm"
          key={campaign.id}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(15rem,25rem)] items-center gap-8 px-5 py-4">
            <CampaignIdentity campaign={campaign} />
            <div>
              <div className="mb-2 flex items-center justify-between gap-4 text-xs tabular-nums">
                <span className="text-base-content/60">
                  Utilisé : {formatCents(campaign.usedAmountCents)} sur{" "}
                  {formatCents(campaign.totalAmountCents)}
                </span>
                <span
                  className={`shrink-0 font-medium ${
                    old ? "text-warning-content" : "text-success"
                  }`}
                >
                  Restant : {formatCents(campaign.remainingAmountCents)}
                </span>
              </div>
              <progress
                className={`progress h-2 w-full ${
                  old ? "progress-warning" : "progress-success"
                }`}
                value={progressValue(campaign)}
                max={100}
                aria-label={`${Math.round(progressValue(campaign))} % utilisés pour ${campaign.name}`}
              />
            </div>
          </div>
          <div className="overflow-x-auto border-t border-base-300">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-base-content/50">
                  <th className="py-2 pr-5 pl-9 text-left font-medium">
                    Subvention
                  </th>
                  <th className="px-5 py-2 text-right font-medium">Accordé</th>
                  <th className="px-5 py-2 text-right font-medium">Utilisé</th>
                  <th className="px-5 py-2 text-right font-medium">Restant</th>
                </tr>
              </thead>
              <tbody>
                {campaign.subventions.map((subvention) => (
                  <tr
                    className="border-t border-base-300/70"
                    key={subvention.id}
                  >
                    <td className="py-2 pr-5 pl-9">
                      <span className="font-medium text-base-content/75">
                        {subvention.reason}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-base-content/70">
                      {formatCents(subvention.totalAmountCents)}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-base-content/70">
                      {formatCents(subvention.usedAmountCents)}
                    </td>
                    <td
                      className={`px-5 py-2 text-right font-medium tabular-nums ${
                        old ? "text-warning-content" : "text-success"
                      }`}
                    >
                      {formatCents(subvention.remainingAmountCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}

function CompactSubventionLines({
  campaign,
  old = false,
}: {
  campaign: Campaign;
  old?: boolean;
}) {
  return (
    <div className="border-t border-base-300 bg-base-100">
      <div className="grid grid-cols-3 gap-3 px-5 pt-2 text-right text-[0.6875rem] text-base-content/45">
        <span>Accordé</span>
        <span>Utilisé</span>
        <span>Restant</span>
      </div>
      {campaign.subventions.map((subvention) => (
        <div
          className="border-t border-base-300/70 px-5 py-2 first:border-t-0"
          key={subvention.id}
        >
          <p className="truncate text-sm font-medium text-base-content/75">
            {subvention.reason}
          </p>
          <div className="mt-1 grid grid-cols-3 gap-3 text-right text-xs">
            <span className="tabular-nums text-base-content/70">
              {formatCents(subvention.totalAmountCents)}
            </span>
            <span className="tabular-nums text-base-content/70">
              {formatCents(subvention.usedAmountCents)}
            </span>
            <span
              className={`font-medium tabular-nums ${
                old ? "text-warning-content" : "text-success"
              }`}
            >
              {formatCents(subvention.remainingAmountCents)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileCampaignList({
  campaigns,
  old = false,
}: {
  campaigns: Campaign[];
  old?: boolean;
}) {
  return (
    <div className="space-y-4 md:hidden">
      {campaigns.length === 0 ? (
        <p className="px-5 py-6 text-sm text-base-content/60">
          Aucune campagne dans cette période.
        </p>
      ) : (
        campaigns.map((campaign) => (
          <article
            className="overflow-hidden rounded-box border border-base-300 bg-base-100"
            key={campaign.id}
          >
            <div className="px-5 py-4">
              <CampaignIdentity campaign={campaign} />
              <div className="mt-4 flex items-center justify-between gap-3 text-xs tabular-nums">
                <span className="text-base-content/60">
                  Utilisé : {formatCents(campaign.usedAmountCents)} sur{" "}
                  {formatCents(campaign.totalAmountCents)}
                </span>
                <span
                  className={`shrink-0 font-medium ${
                    old ? "text-warning-content" : "text-success"
                  }`}
                >
                  Restant : {formatCents(campaign.remainingAmountCents)}
                </span>
              </div>
              <progress
                className={`progress mt-2 h-2 w-full ${
                  old ? "progress-warning" : "progress-success"
                }`}
                value={progressValue(campaign)}
                max={100}
                aria-label={`${Math.round(progressValue(campaign))} % utilisés pour ${campaign.name}`}
              />
            </div>
            <CompactSubventionLines campaign={campaign} old={old} />
          </article>
        ))
      )}
    </div>
  );
}

function LedgerContent({
  bands,
  isDemo,
}: {
  bands: Record<AgeBand, Campaign[]>;
  isDemo: boolean;
}) {
  const totalGranted = bands.recent.reduce(
    (total, campaign) => total + campaign.totalAmountCents,
    0,
  );
  const totalUsed = bands.recent.reduce(
    (total, campaign) => total + campaign.usedAmountCents,
    0,
  );

  return (
    <div className="max-w-4xl pb-24">
      <PageHeading isDemo={isDemo} />

      <section className="mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold">Campagnes récentes</h2>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-base-content/50">Accordé</p>
              <p className="mt-1 font-medium tabular-nums">
                {formatCents(totalGranted)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-base-content/50">
                Montant disponible
              </p>
              <p className="mt-1 font-semibold tabular-nums text-success">
                {formatCents(totalGranted - totalUsed)}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <DesktopCampaignList campaigns={bands.recent} />
          <MobileCampaignList campaigns={bands.recent} />
        </div>
      </section>

      <OldCampaignsSection campaigns={bands.old} />
      <HistorySection campaigns={bands.history} />
    </div>
  );
}

function HistoryList({ campaigns }: { campaigns: Campaign[] }) {
  if (campaigns.length === 0) {
    return (
      <p className="py-4 text-sm text-base-content/60">
        Aucune subvention archivée.
      </p>
    );
  }

  return (
    <div className="divide-y divide-base-300">
      {campaigns.map((campaign) => (
        <div
          className="flex items-center justify-between gap-4 py-3"
          key={campaign.id}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{campaign.name}</p>
            <p className="text-xs text-base-content/50">
              {subventionTypeLabel[campaign.type]}
            </p>
          </div>
          <p className="shrink-0 text-sm tabular-nums">
            <span className="text-base-content/80">
              {formatCents(campaign.usedAmountCents)}
            </span>{" "}
            <span className="text-base-content/40">
              utilisés sur {formatCents(campaign.totalAmountCents)}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * "Subventions anciennes" et "Historique" sont deux onglets rétractables
 * l'un sous l'autre dans le flux principal (plus de colonne latérale) :
 * repliés par défaut, ce sont des zones secondaires qu'on consulte au besoin
 * plutôt que du contenu à afficher en permanence.
 */
function OldCampaignsSection({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <section className="mt-6">
      <div className="collapse-arrow collapse border border-base-300 bg-base-100 shadow-sm">
        <input type="checkbox" />
        <div className="collapse-title flex items-center gap-2 font-semibold">
          <TriangleAlert
            aria-hidden="true"
            className="shrink-0 text-base-content/50"
            size={18}
          />
          Subventions anciennes
          <span className="font-normal text-base-content/60">
            ({pluralizeCampaign(campaigns.length)})
          </span>
        </div>
        <div className="collapse-content">
          <div className="border-t border-base-300 pt-4">
            <DesktopCampaignList campaigns={campaigns} old />
            <MobileCampaignList campaigns={campaigns} old />
          </div>
        </div>
      </div>
    </section>
  );
}

function HistorySection({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <section className="mt-3">
      <div className="collapse-arrow collapse border border-base-300 bg-base-100 shadow-sm">
        <input type="checkbox" />
        <div className="collapse-title flex items-center gap-2 font-semibold">
          <History aria-hidden="true" size={17} />
          Historique
          <span className="font-normal text-base-content/60">
            ({pluralizeCampaign(campaigns.length)})
          </span>
        </div>
        <div className="collapse-content">
          <div className="border-t border-base-300 pt-4">
            <HistoryList campaigns={campaigns} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function SubventionsLedger({
  subventions,
  isDemo = false,
}: {
  subventions: VisibleSubvention[];
  isDemo?: boolean;
}) {
  const bands = splitCampaigns(subventions);
  return <LedgerContent bands={bands} isDemo={isDemo} />;
}
