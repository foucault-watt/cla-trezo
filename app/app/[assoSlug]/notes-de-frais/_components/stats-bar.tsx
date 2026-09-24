import type { ExpenseReportOverview } from "@/lib/expense-reports/expense-reports";
import { formatCents } from "@/lib/money";
import { Stat, StatsBar as StatsBarSurface } from "@/components/ui/stats";

export function StatsBar({ reports }: { reports: ExpenseReportOverview[] }) {
  const enAttente = reports.filter(
    (r) => r.status === "SUBMITTED" || r.status === "TAKEN_OVER",
  ).length;
  const validees = reports.filter((r) => r.status === "FINALIZED").length;
  const totalAmountCents = reports.reduce(
    (sum, r) => sum + r.totalAmountCents,
    0,
  );

  return (
    <StatsBarSurface className="mb-6">
      <Stat title="Notes de frais" value={reports.length} />
      <Stat title="En attente" value={enAttente} />
      <Stat title="Validées" value={validees} />
      <Stat title="Montant total" value={formatCents(totalAmountCents)} />
    </StatsBarSurface>
  );
}
