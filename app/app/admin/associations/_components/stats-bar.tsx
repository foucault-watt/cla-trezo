import type { AssoOverview } from "@/lib/admin/associations";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function StatsBar({ associations }: { associations: AssoOverview[] }) {
  const totalSoldeCents = associations.reduce(
    (sum, a) => sum + (a.solde.status === "ready" ? a.solde.balanceCents : 0),
    0,
  );
  const clubsNonInitialises = associations.filter(
    (a) => a.solde.status === "not_initialized",
  ).length;
  const typesNonDefinis = associations.filter((a) => a.type === null).length;
  const facturesEnAttente = associations.reduce(
    (sum, a) => sum + a.facturesEnAttente,
    0,
  );

  return (
    <div className="stats stats-vertical mb-6 w-full border border-base-300 shadow-md sm:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Solde total des Clubs</div>
        <div className="stat-value text-2xl">
          {currency.format(totalSoldeCents / 100)}
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
        <div className="stat-title">Factures en attente</div>
        <div className="stat-value text-2xl">{facturesEnAttente}</div>
      </div>
    </div>
  );
}
