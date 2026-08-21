import { ViewToggle } from "@/components/nav/view-toggle";
import { listSubventionCampaigns } from "@/lib/admin/subvention-campaigns";
import { CampaignsListView } from "./_components/campaigns-list-view";
import { CampaignsGridView } from "./_components/campaigns-grid-view";
import { NewCampaignModalButton } from "./_components/new-campaign-modal-button";

export default async function AdminSubventionsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const current = view === "grid" || view === "list" ? view : undefined;
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
        <div className="flex items-center gap-2">
          <ViewToggle current={current} />
          <NewCampaignModalButton />
        </div>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-base-content/70">
          Aucune campagne pour l&apos;instant.
        </p>
      ) : current === "list" ? (
        <CampaignsListView campaigns={campaigns} />
      ) : current === "grid" ? (
        <CampaignsGridView campaigns={campaigns} />
      ) : (
        <>
          <div className="sm:hidden">
            <CampaignsGridView campaigns={campaigns} />
          </div>
          <div className="hidden sm:block">
            <CampaignsListView campaigns={campaigns} />
          </div>
        </>
      )}
    </div>
  );
}
