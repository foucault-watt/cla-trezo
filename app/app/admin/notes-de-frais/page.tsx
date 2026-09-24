import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { listExpenseReportsForAdmin } from "@/lib/admin/expense-reports";
import { AdminExpenseReportsList } from "./_components/expense-reports-list";

export const metadata: Metadata = {
  title: "Notes de frais",
};

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
        <EmptyState
          icon={<Receipt size={24} />}
          title="Aucune Note de frais soumise"
          description="Les Notes de frais apparaîtront ici dès qu'une Asso en soumettra une."
        />
      ) : (
        <AdminExpenseReportsList reports={reports} />
      )}
    </div>
  );
}
