import type { Metadata } from "next";
import { RecentActivityAccordion } from "@/components/dashboard/recent-activity-accordion";
import { SoldeHistoryAccordion } from "@/components/dashboard/solde-history-accordion";
import { SoldeNotInitializedAlert } from "@/components/solde/solde-not-initialized-alert";
import { Stat, StatsBar } from "@/components/ui/stats";
import { getDashboardOverview } from "@/lib/dashboard/dashboard-overview";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ assoSlug: string }>;
}) {
  const { assoSlug } = await params;
  const overview = await getDashboardOverview(assoSlug);
  const { solde } = overview;
  const isClub = solde.status === "not_initialized" || solde.status === "ready";

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-base-content/70">
        {isClub
          ? "Solde de l'association."
          : "Suivi des Notes de frais et Subventions de l'association."}
      </p>

      <StatsBar className="mt-4">
        {solde.status === "ready" && (
          <Stat title="Solde actuel" value={formatCents(solde.balanceCents)} />
        )}
        <Stat
          title="Notes de frais en attente"
          value={overview.notesDeFrais.enAttente}
          desc={`${overview.notesDeFrais.totalLast365Days} sur les 12 derniers mois`}
        />
        <Stat
          title="Subventions restantes"
          value={formatCents(overview.subventions.montantRestantLast365DaysCents)}
          desc={`sur ${formatCents(overview.subventions.montantTotalLast365DaysCents)} · 12 derniers mois`}
        />
      </StatsBar>

      {solde.status === "not_initialized" && (
        <SoldeNotInitializedAlert className="mt-6" />
      )}

      {solde.status === "ready" && (
        <>
          <h3 className="mt-6 mb-2 text-sm font-medium text-base-content/70">
            Historique du solde
          </h3>
          <SoldeHistoryAccordion groups={overview.soldeMovementsByYear} />
        </>
      )}

      {!isClub && (
        <>
          <h3 className="mt-6 mb-2 text-sm font-medium text-base-content/70">
            Activité récente
          </h3>
          <RecentActivityAccordion groups={overview.recentActivityByYear} />
        </>
      )}
    </div>
  );
}
