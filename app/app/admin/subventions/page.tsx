import { listSubventionCampaigns } from "@/lib/admin/subvention-campaigns";
import { CampaignsList } from "./_components/campaigns-list";
import { NewCampaignModalButton } from "./_components/new-campaign-modal-button";

export default async function AdminSubventionsPage() {
  const campaigns = await listSubventionCampaigns();

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Subventions</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Campagnes de subvention et Subventions accordées aux Assos.
          </p>
        </div>
        <NewCampaignModalButton />
      </div>

      {campaigns.length === 0 ? (
        <p className="text-base-content/70">
          Aucune campagne pour l&apos;instant.
        </p>
      ) : (
        <CampaignsList campaigns={campaigns} />
      )}
    </div>
  );
}
