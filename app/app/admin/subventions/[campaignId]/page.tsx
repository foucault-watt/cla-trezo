import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSubventionCampaign,
  listAssosForSelect,
} from "@/lib/admin/subvention-campaigns";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import {
  campaignStatusLabel,
  campaignStatusBadgeClass,
} from "@/lib/subventions/status";
import { formatCents } from "@/lib/money";
import { AddSubventionForm } from "./_components/add-subvention-form";
import { EditCampaignForm } from "./_components/edit-campaign-form";
import { SubventionRow } from "./_components/subvention-row";

export default async function AdminSubventionCampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const [campaign, assos] = await Promise.all([
    getSubventionCampaign(campaignId),
    listAssosForSelect(),
  ]);
  if (!campaign) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/app/admin/subventions"
        className="link link-hover text-sm text-base-content/70"
      >
        ← Toutes les campagnes
      </Link>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {subventionTypeLabel[campaign.type]} {campaign.name}
          </h1>
          <p className="mt-1 text-sm text-base-content/70">
            {campaign.date.toLocaleDateString("fr-FR")}
          </p>
        </div>
        <span className={`badge ${campaignStatusBadgeClass[campaign.status]}`}>
          {campaignStatusLabel[campaign.status]}
        </span>
      </div>

      <div className="stats stats-vertical mt-6 w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal">
        <div className="stat">
          <div className="stat-title">Subventions</div>
          <div className="stat-value text-2xl">{campaign.subventionsCount}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Montant total</div>
          <div className="stat-value text-2xl">
            {formatCents(campaign.totalAmountCents)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-md">
          <table className="table">
            <thead>
              <tr>
                <th>Structure</th>
                <th>Raison</th>
                <th>Montant</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {campaign.subventions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-base-content/70">
                    Aucune Subvention pour l&apos;instant.
                  </td>
                </tr>
              ) : (
                campaign.subventions.map((subvention) => (
                  <SubventionRow
                    key={subvention.id}
                    campaignId={campaign.id}
                    subvention={subvention}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <AddSubventionForm campaignId={campaign.id} assos={assos} />
      </div>

      <div className="collapse-arrow collapse mt-8 border border-base-300 bg-base-100">
        <input type="checkbox" />
        <div className="collapse-title font-medium">
          Réglages : modifier la campagne
        </div>
        <div className="collapse-content">
          <EditCampaignForm
            campaignId={campaign.id}
            type={campaign.type}
            name={campaign.name}
            date={campaign.date}
            publicationDate={campaign.publicationDate}
          />
        </div>
      </div>
    </div>
  );
}
