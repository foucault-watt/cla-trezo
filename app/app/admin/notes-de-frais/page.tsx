import { ViewToggle } from "@/components/nav/view-toggle";
import { listExpenseReportsForAdmin } from "@/lib/admin/expense-reports";
import { ListView } from "./_components/list-view";
import { GridView } from "./_components/grid-view";

export default async function AdminNotesDeFraisPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const current = view === "grid" || view === "list" ? view : undefined;
  const reports = await listExpenseReportsForAdmin();

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notes de frais</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Notes de frais Soumises ou Prises en charge, toutes Assos
            confondues.
          </p>
        </div>
        {reports.length > 0 && <ViewToggle current={current} />}
      </div>

      {reports.length === 0 ? (
        <p className="text-base-content/70">
          Aucune Note de frais en attente de traitement.
        </p>
      ) : current === "list" ? (
        <ListView reports={reports} />
      ) : current === "grid" ? (
        <GridView reports={reports} />
      ) : (
        <>
          <div className="sm:hidden">
            <GridView reports={reports} />
          </div>
          <div className="hidden sm:block">
            <ListView reports={reports} />
          </div>
        </>
      )}
    </div>
  );
}
