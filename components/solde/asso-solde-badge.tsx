import { formatCents } from "@/lib/money";
import type { SoldeView } from "@/lib/solde/solde";

export function AssoSoldeBadge({
  solde,
  size = "md",
}: {
  solde: SoldeView;
  size?: "sm" | "md";
}) {
  if (solde.status === "type_undefined" || solde.status === "not_applicable") {
    return <span className="text-base-content/40">—</span>;
  }

  if (solde.status === "not_initialized") {
    return (
      <span
        className={`badge badge-warning badge-outline ${size === "sm" ? "badge-sm" : ""}`}
      >
        Non initialisé
      </span>
    );
  }

  return (
    <span
      className={`font-semibold ${solde.balanceCents < 0 ? "text-error" : ""}`}
    >
      {formatCents(solde.balanceCents)}
    </span>
  );
}
