import { notFound } from "next/navigation";
import { BackLink } from "@/components/nav/back-link";
import { listGrantDocumentStatuses } from "@/lib/admin/grant-documents";
import {
  getSubventionCampaign,
  listAssosForSelect,
} from "@/lib/admin/subvention-campaigns";
import { subventionTypeLabel } from "@/lib/subventions/labels";
import {
  campaignStatusLabel,
  campaignStatusBadgeClass,
} from "@/lib/subventions/status";
import { EditCampaignForm } from "./_components/edit-campaign-form";
import { DeleteCampaignButton } from "./_components/delete-campaign-button";
import { SubventionsPanel } from "./_components/subventions-panel";

export default async function AdminSubventionCampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const [campaign, assos, grantDocumentStatuses] = await Promise.all([
    getSubventionCampaign(campaignId),
    listAssosForSelect(),
    listGrantDocumentStatuses(campaignId),
  ]);
  if (!campaign) {
    notFound();
  }

  return (
    <div>
      <BackLink href="/app/admin/subventions" label="Toutes les campagnes" />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {subventionTypeLabel[campaign.type]} {campaign.name}
          </h1>
          <p className="mt-1 text-sm text-base-content/70">
            {campaign.date.toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EditCampaignForm
            campaignId={campaign.id}
            type={campaign.type}
            name={campaign.name}
            date={campaign.date}
            publicationDate={campaign.publicationDate}
          />
          <span
            className={`badge ${campaignStatusBadgeClass[campaign.status]}`}
          >
            {campaignStatusLabel[campaign.status]}
          </span>
        </div>
      </div>

      <SubventionsPanel
        campaignId={campaign.id}
        initialSubventions={campaign.subventions}
        assos={assos}
        grantDocumentStatuses={grantDocumentStatuses}
      />

      <div className="mt-8">
        <DeleteCampaignButton
          campaignId={campaign.id}
          name={`${subventionTypeLabel[campaign.type]} ${campaign.name}`}
        />
      </div>
    </div>
  );
}
