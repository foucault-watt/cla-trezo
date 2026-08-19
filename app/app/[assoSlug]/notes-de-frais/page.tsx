import Link from "next/link";
import { ViewToggle } from "@/components/nav/view-toggle";
import { listExpenseReports } from "@/lib/expense-reports/expense-reports";
import { StatsBar } from "./_components/stats-bar";
import { ListView } from "./_components/list-view";
import { GridView } from "./_components/grid-view";
import { ExpenseReportGuide } from "./_components/expense-report-guide";

export default async function NotesDeFraisPage({
  params,
  searchParams,
}: {
  params: Promise<{ assoSlug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { assoSlug } = await params;
  const { view } = await searchParams;
  const current = view === "grid" ? "grid" : "list";
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
          {reports.length > 0 && <ViewToggle current={current} />}
          <Link
            href={`/app/${assoSlug}/notes-de-frais/nouvelle`}
            className="btn btn-primary"
          >
            Nouvelle Note de frais
          </Link>
        </div>
      </div>

      <ExpenseReportGuide />

      <StatsBar reports={reports} />

      {reports.length === 0 ? (
        <p className="text-base-content/70">
          Aucune Note de frais pour l&apos;instant.
        </p>
      ) : current === "list" ? (
        <ListView assoSlug={assoSlug} reports={reports} />
      ) : (
        <GridView assoSlug={assoSlug} reports={reports} />
      )}
    </div>
  );
}
