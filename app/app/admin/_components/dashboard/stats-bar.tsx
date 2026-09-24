import type { DashboardData } from "@/lib/admin/dashboard";
import { formatCents } from "@/lib/money";
import { Stat, StatsBar as StatsBarSurface } from "@/components/ui/stats";

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const pct = pctDelta(current, previous);
  if (pct === null) return null;
  const sign = pct >= 0 ? "+" : "";
  return (
    <span className={pct >= 0 ? "text-success" : "text-error"}>
      {sign}
      {pct.toFixed(1)}% vs 365j précédents
    </span>
  );
}

export function StatsBar({ data }: { data: DashboardData }) {
  return (
    <StatsBarSurface className="mb-6">
      <Stat title="Assos actives" value={data.assosActives} />
      <Stat
        title="Subventions accordées (365 derniers jours)"
        value={formatCents(data.subventionsAccordeesCents365j)}
        desc={
          <DeltaBadge
            current={data.subventionsAccordeesCents365j}
            previous={data.subventionsAccordeesCents365jPrecedents}
          />
        }
      />
      <Stat
        title="Remboursé (365 derniers jours)"
        value={formatCents(data.montantRembourseCents365j)}
        desc={
          <DeltaBadge
            current={data.montantRembourseCents365j}
            previous={data.montantRembourseCents365jPrecedents}
          />
        }
      />
      <Stat
        title="Notes de frais prises en charge ce mois-ci"
        value={data.notesTraiteesCeMois}
      />
    </StatsBarSurface>
  );
}
