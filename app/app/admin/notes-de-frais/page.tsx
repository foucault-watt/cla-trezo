import { listExpenseReportsForAdmin } from "@/lib/admin/expense-reports";
import { AdminExpenseReportsList } from "./_components/expense-reports-list";

export default async function AdminNotesDeFraisPage() {
  const reports = await listExpenseReportsForAdmin();

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notes de frais</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Notes de frais soumises, toutes Assos confondues.
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <p className="text-base-content/70">Aucune Note de frais soumise.</p>
      ) : (
        <AdminExpenseReportsList reports={reports} />
      )}
    </div>
  );
}
