import { formatCents } from "@/lib/money";
import type { SoldeMovement } from "@/lib/solde/solde";

const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

export function SoldeMovementRow({ movement }: { movement: SoldeMovement }) {
  return (
    <div className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-x-3 py-1.5">
      <span className="pt-0.5 text-xs whitespace-nowrap text-base-content/50">
        {dayFormat.format(movement.createdAt)}
      </span>
      <span className="text-sm">
        {movement.description ?? movement.category ?? "Mouvement"}
      </span>
      <span
        className={`text-right text-sm font-medium tabular-nums ${movement.movementType === "CREDIT" ? "text-success" : "text-error"}`}
      >
        {movement.movementType === "CREDIT" ? "+" : "-"}
        {formatCents(movement.amountCents)}
      </span>
    </div>
  );
}
