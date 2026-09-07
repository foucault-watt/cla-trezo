import type { AssoOverview } from "@/lib/admin/associations";
import { formatCents } from "@/lib/money";

export function StatsBar({ associations }: { associations: AssoOverview[] }) {
  const totalSoldeCents = associations.reduce(
    (sum, a) => sum + (a.solde.status === "ready" ? a.solde.balanceCents : 0),
    0,
  );
  const clubsNonInitialises = associations.filter(
    (a) => a.solde.status === "not_initialized",
  ).length;
  const typesNonDefinis = associations.filter((a) => a.type === null).length;
  const notesDeFraisEnAttente = associations.reduce(
    (sum, a) => sum + a.notesDeFraisEnAttente,
    0,
  );

  return (
    <div className="stats stats-vertical mb-6 w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Solde total des Clubs</div>
        <div className="stat-value text-2xl">
          {formatCents(totalSoldeCents)}
        </div>
      </div>
      {typesNonDefinis > 0 && (
        <div className="stat">
          <div className="stat-title">Types à définir</div>
          <div className="stat-value text-2xl text-error">
            {typesNonDefinis}
          </div>
        </div>
      )}
      <div className="stat">
        <div className="stat-title">Clubs non initialisés</div>
        <div className="stat-value text-2xl">{clubsNonInitialises}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Notes de frais en attente</div>
        <div className="stat-value text-2xl">{notesDeFraisEnAttente}</div>
      </div>
    </div>
  );
}
