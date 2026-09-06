import { HandCoins, Receipt, Wallet } from "lucide-react";
import { RecentActivityAccordion } from "@/components/dashboard/recent-activity-accordion";
import { SoldeHistoryAccordion } from "@/components/dashboard/solde-history-accordion";
import { getDashboardOverview } from "@/lib/dashboard/dashboard-overview";
import { formatCents } from "@/lib/money";

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
      <p className="mt-2 text-base-content/70">
        {isClub
          ? "Solde de l'association."
          : "Suivi des Notes de frais et Subventions de l'association."}
      </p>

      <div className="stats stats-vertical mt-4 w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal">
        {solde.status === "ready" && (
          <div className="stat">
            <div className="stat-figure text-primary">
              <Wallet size={22} />
            </div>
            <div className="stat-title">Solde actuel</div>
            <div className="stat-value text-2xl">
              {formatCents(solde.balanceCents)}
            </div>
          </div>
        )}
        <div className="stat">
          <div className="stat-figure text-warning">
            <Receipt size={22} />
          </div>
          <div className="stat-title">Notes de frais en attente</div>
          <div className="stat-value text-2xl">
            {overview.notesDeFrais.enAttente}
          </div>
          <div className="stat-desc">
            {overview.notesDeFrais.totalLast365Days} sur les 12 derniers mois
          </div>
        </div>
        <div className="stat">
          <div className="stat-figure text-success">
            <HandCoins size={22} />
          </div>
          <div className="stat-title">Subventions restantes</div>
          <div className="stat-value text-2xl">
            {formatCents(overview.subventions.montantRestantLast365DaysCents)}
          </div>
          <div className="stat-desc">
            sur {formatCents(overview.subventions.montantTotalLast365DaysCents)}{" "}
            · 12 derniers mois
          </div>
        </div>
      </div>

      {solde.status === "not_initialized" && (
        <div role="alert" className="alert alert-info alert-soft mt-6">
          <span>
            Le solde de ce Club n&apos;a pas encore été initialisé par un
            administrateur.
          </span>
        </div>
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
