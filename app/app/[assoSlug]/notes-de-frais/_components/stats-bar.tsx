import type { ExpenseReportOverview } from "@/lib/expense-reports/expense-reports";
import { formatCents } from "@/lib/money";

function StatCell({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-box border border-base-300 bg-base-100 p-3 shadow-sm">
      <div className="text-xs text-base-content/60">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

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
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCell label="Notes de frais" value={reports.length} />
      <StatCell label="En attente" value={enAttente} />
      <StatCell label="Validées" value={validees} />
      <StatCell label="Montant total" value={formatCents(totalAmountCents)} />
    </div>
  );
}
