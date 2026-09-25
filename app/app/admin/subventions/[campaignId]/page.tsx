import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/nav/back-link";
import { listGrantDocumentRows } from "@/lib/admin/grant-documents";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}): Promise<Metadata> {
  const { campaignId } = await params;
  const campaign = await getSubventionCampaign(campaignId);
  return {
    title: campaign
      ? `${subventionTypeLabel[campaign.type]} ${campaign.name}`
      : "Campagne introuvable",
  };
}

export default async function AdminSubventionCampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const [campaign, assos, grantDocumentRows] = await Promise.all([
    getSubventionCampaign(campaignId),
    listAssosForSelect(),
    listGrantDocumentRows(campaignId),
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
        subventions={campaign.subventions}
        totalAmountCents={campaign.totalAmountCents}
        assos={assos}
        grantDocumentRows={grantDocumentRows}
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
