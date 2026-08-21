import { listCurrentSubventions } from "@/lib/subventions/visible-subventions";
import { SubventionsByCampaign } from "./_components/subventions-by-campaign";
import { HistoriqueSection } from "./_components/historique-section";

export default async function SubventionsPage({
  params,
}: {
  params: Promise<{ assoSlug: string }>;
}) {
  const { assoSlug } = await params;
  const subventions = await listCurrentSubventions(assoSlug);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold">Subventions</h1>
        <p className="mt-2 text-base-content/70">
          Subventions accordées à l&apos;association.
        </p>
      </div>

      {subventions.length === 0 ? (
        <p className="mt-6 text-base-content/70">
          Aucune Subvention publiée pour l&apos;instant.
        </p>
      ) : (
        <div className="mt-6">
          <SubventionsByCampaign subventions={subventions} />
        </div>
      )}

      <HistoriqueSection assoSlug={assoSlug} />
    </div>
  );
}
