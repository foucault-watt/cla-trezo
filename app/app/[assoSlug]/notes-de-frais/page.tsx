import { listExpenseReports } from "@/lib/expense-reports/expense-reports";
import { StatsBar } from "./_components/stats-bar";
import { ExpenseReportsList } from "./_components/expense-reports-list";
import { ExpenseReportGuide } from "./_components/expense-report-guide";
import { NewExpenseReportModalButton } from "./_components/new-expense-report-modal-button";

export default async function NotesDeFraisPage({
  params,
}: {
  params: Promise<{ assoSlug: string }>;
}) {
  const { assoSlug } = await params;
  const reports = await listExpenseReports(assoSlug);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notes de frais</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Demandes de remboursement de l&apos;association.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewExpenseReportModalButton assoSlug={assoSlug} />
        </div>
      </div>

      <ExpenseReportGuide />

      <StatsBar reports={reports} />

      {reports.length === 0 ? (
        <p className="text-base-content/70">
          Aucune Note de frais pour l&apos;instant.
        </p>
      ) : (
        <ExpenseReportsList assoSlug={assoSlug} reports={reports} />
      )}
    </div>
  );
}
