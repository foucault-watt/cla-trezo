import type { Metadata } from "next";
import { HandCoins } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { listSubventionCampaigns } from "@/lib/admin/subvention-campaigns";
import { CampaignsList } from "./_components/campaigns-list";
import { NewCampaignModalButton } from "./_components/new-campaign-modal-button";

export const metadata: Metadata = {
  title: "Subventions",
};

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
        <EmptyState
          icon={<HandCoins size={24} />}
          title="Aucune campagne de subvention"
          description="Créez une campagne pour y accorder des Subventions aux Assos."
        />
      ) : (
        <CampaignsList campaigns={campaigns} />
      )}
    </div>
  );
}
