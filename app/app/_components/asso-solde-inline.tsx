// Copie volontairement légère de AssoSoldeCell (admin/associations) : /app est
// une page hors du périmètre Admin, on évite d'y importer un composant d'une
// autre section pour ce simple formattage de 10 lignes.
import type { SoldeView } from "@/lib/solde/solde";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function AssoSoldeInline({ solde }: { solde: SoldeView }) {
  if (solde.status === "type_undefined" || solde.status === "not_applicable") {
    return <span className="text-base-content/40">—</span>;
  }

  if (solde.status === "not_initialized") {
    return (
      <span className="badge badge-warning badge-outline badge-sm">
        Non initialisé
      </span>
    );
  }

  return (
    <span
      className={`font-semibold ${solde.balanceCents < 0 ? "text-error" : ""}`}
    >
      {currency.format(solde.balanceCents / 100)}
    </span>
  );
}
