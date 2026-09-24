import type { AssoOverview } from "@/lib/admin/associations";
import { formatCents } from "@/lib/money";
import { Stat, StatsBar as StatsBarSurface } from "@/components/ui/stats";

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
    <StatsBarSurface className="mb-6">
      <Stat title="Solde total des Clubs" value={formatCents(totalSoldeCents)} />
      {typesNonDefinis > 0 && (
        <Stat
          title="Types à définir"
          value={typesNonDefinis}
          valueClassName="text-error"
        />
      )}
      <Stat title="Clubs non initialisés" value={clubsNonInitialises} />
      <Stat title="Notes de frais en attente" value={notesDeFraisEnAttente} />
    </StatsBarSurface>
  );
}
