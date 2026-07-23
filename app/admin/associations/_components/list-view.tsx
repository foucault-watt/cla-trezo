// Row-based (not a literal <table>), dense, zebra-striped.
// Status is a fixed-width dot at the start (never variable-width text there,
// since that would shift every column after it) and the full text badge
// moves to the end of the row, where its width can vary safely.
import { mockAssociations, statutBadgeClass, statutDotClass, statutLabel } from "./data";

const currency = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function ListView() {
  return (
    <div className="overflow-hidden rounded-box border border-base-300">
      {mockAssociations.map((asso, i) => (
        <div
          key={asso.slug}
          className={`flex items-center gap-3 px-4 py-2.5 ${
            i % 2 === 1 ? "bg-base-200/60" : "bg-base-100"
          }`}
        >
          <span
            className={`size-2.5 shrink-0 rounded-full ${statutDotClass[asso.statut]}`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{asso.name}</div>
            <div className="truncate text-xs text-base-content/60 sm:hidden">
              {asso.subventionsEnCours} subvention(s) · {asso.facturesEnAttente} facture(s)
            </div>
          </div>
          <div className="hidden w-28 shrink-0 text-right text-sm text-base-content/70 sm:block">
            {asso.subventionsEnCours} subv.
          </div>
          <div className="hidden w-32 shrink-0 text-right text-sm text-base-content/70 sm:block">
            {asso.facturesEnAttente} facture(s)
          </div>
          <div
            className={`w-24 shrink-0 text-right font-semibold ${
              asso.solde < 0 ? "text-error" : ""
            }`}
          >
            {currency.format(asso.solde)}
          </div>
          <span className={`badge shrink-0 ${statutBadgeClass[asso.statut]}`}>
            {statutLabel[asso.statut]}
          </span>
        </div>
      ))}
    </div>
  );
}
