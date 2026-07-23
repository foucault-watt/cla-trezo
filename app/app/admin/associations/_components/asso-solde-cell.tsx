import type { SoldeView } from "@/lib/solde/solde";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function AssoSoldeCell({ solde }: { solde: SoldeView }) {
  if (solde.status === "type_undefined" || solde.status === "not_applicable") {
    return <span className="text-base-content/40">—</span>;
  }

  if (solde.status === "not_initialized") {
    return (
      <span className="badge badge-warning badge-soft">Non initialisé</span>
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
