import type { ExpenseReportOverview } from "@/lib/expense-reports/expense-reports";
import { formatCents } from "@/lib/money";

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
    <div className="stats stats-vertical mb-6 w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Notes de frais</div>
        <div className="stat-value text-2xl">{reports.length}</div>
      </div>
      <div className="stat">
        <div className="stat-title">En attente</div>
        <div className="stat-value text-2xl">{enAttente}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Validées</div>
        <div className="stat-value text-2xl">{validees}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Montant total</div>
        <div className="stat-value text-2xl">
          {formatCents(totalAmountCents)}
        </div>
      </div>
    </div>
  );
}
