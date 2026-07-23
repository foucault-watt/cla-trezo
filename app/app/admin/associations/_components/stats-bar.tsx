import { mockAssociations } from "./data";

const currency = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function StatsBar() {
  const totalSolde = mockAssociations.reduce((sum, a) => sum + a.solde, 0);
  const enAttention = mockAssociations.filter((a) => a.statut !== "a-jour").length;
  const facturesEnAttente = mockAssociations.reduce((sum, a) => sum + a.facturesEnAttente, 0);

  return (
    <div className="stats stats-vertical mb-6 w-full border border-base-300 shadow-md sm:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Solde total</div>
        <div className="stat-value text-2xl">{currency.format(totalSolde)}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Associations à surveiller</div>
        <div className="stat-value text-2xl">{enAttention}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Factures en attente</div>
        <div className="stat-value text-2xl">{facturesEnAttente}</div>
      </div>
    </div>
  );
}
