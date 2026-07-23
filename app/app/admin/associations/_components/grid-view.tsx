// A tinted surface behind the grid plus a visible border and shadow on each
// card gives enough contrast for cards to read as distinct objects.
import { mockAssociations, statutBadgeClass, statutLabel } from "./data";

const currency = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function GridView() {
  return (
    <div className="rounded-box bg-base-200/60 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockAssociations.map((asso) => (
          <div key={asso.slug} className="card border border-base-300 bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex items-start justify-between gap-2">
                <h2 className="card-title text-base">{asso.name}</h2>
                <span className={`badge ${statutBadgeClass[asso.statut]}`}>
                  {statutLabel[asso.statut]}
                </span>
              </div>
              <p className={`text-2xl font-semibold ${asso.solde < 0 ? "text-error" : ""}`}>
                {currency.format(asso.solde)}
              </p>
              <p className="text-sm text-base-content/70">
                {asso.subventionsEnCours} subvention(s) en cours · {asso.facturesEnAttente} facture(s) en attente
              </p>
              <div className="card-actions justify-end">
                <button className="btn btn-sm">Voir le détail</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
