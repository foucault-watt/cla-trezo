import type { DashboardData } from "@/lib/admin/dashboard";
import { formatCents } from "@/lib/money";

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const pct = pctDelta(current, previous);
  if (pct === null) return null;
  const sign = pct >= 0 ? "+" : "";
  return (
    <span className={`stat-desc ${pct >= 0 ? "text-success" : "text-error"}`}>
      {sign}
      {pct.toFixed(1)}% vs 365j précédents
    </span>
  );
}

export function StatsBar({ data }: { data: DashboardData }) {
  return (
    <div className="stats stats-vertical mb-6 w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Structures actives</div>
        <div className="stat-value text-2xl">{data.assosActives}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Subventions accordées (365 derniers jours)</div>
        <div className="stat-value text-2xl">
          {formatCents(data.subventionsAccordeesCents365j)}
        </div>
        <DeltaBadge
          current={data.subventionsAccordeesCents365j}
          previous={data.subventionsAccordeesCents365jPrecedents}
        />
      </div>
      <div className="stat">
        <div className="stat-title">Remboursé (365 derniers jours)</div>
        <div className="stat-value text-2xl">
          {formatCents(data.montantRembourseCents365j)}
        </div>
        <DeltaBadge
          current={data.montantRembourseCents365j}
          previous={data.montantRembourseCents365jPrecedents}
        />
      </div>
      <div className="stat">
        <div className="stat-title">Notes de frais prises en charge ce mois-ci</div>
        <div className="stat-value text-2xl">{data.notesTraiteesCeMois}</div>
      </div>
    </div>
  );
}
