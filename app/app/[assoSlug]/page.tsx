import { SoldeCard } from "@/components/solde/solde-card";
import { getClubSolde } from "@/lib/solde/actions";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ assoSlug: string }>;
}) {
  const { assoSlug } = await params;
  const solde = await getClubSolde(assoSlug);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>
      <p className="mt-2 text-base-content/70">Solde de l&apos;association.</p>

      {(solde.status === "not_initialized" || solde.status === "ready") && (
        <SoldeCard solde={solde} />
      )}
    </div>
  );
}
