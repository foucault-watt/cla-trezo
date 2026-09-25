import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { isReadOnlyAdminAccess } from "@/lib/auth/access";
import { requireStructureAccess } from "@/lib/auth/guards";
import { listExpenseReports } from "@/lib/expense-reports/expense-reports";
import { StatsBar } from "./_components/stats-bar";
import { ExpenseReportsList } from "./_components/expense-reports-list";
import { ExpenseReportGuide } from "./_components/expense-report-guide";
import { NewExpenseReportModalButton } from "./_components/new-expense-report-modal-button";

export const metadata: Metadata = {
  title: "Notes de frais",
};

export default async function NotesDeFraisPage({
  params,
}: {
  params: Promise<{ assoSlug: string }>;
}) {
  const { assoSlug } = await params;
  const [reports, { structure }] = await Promise.all([
    listExpenseReports(assoSlug),
    requireStructureAccess(assoSlug),
  ]);
  // Un Admin non membre consulte sans créer : il ne traite une Note qu'une
  // fois soumise puis prise en charge, depuis l'espace Admin (ADR-0001).
  const canCreate = !isReadOnlyAdminAccess(structure);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Notes de frais</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Demandes de remboursement de l&apos;Asso.
        </p>
      </div>

      <ExpenseReportGuide />

      <StatsBar reports={reports} />

      {reports.length === 0 ? (
        <EmptyState
          icon={<Receipt size={24} />}
          title="Aucune Note de frais pour l'instant"
          description="Créez une Note de frais pour vous faire rembourser une dépense engagée pour l'Asso."
          action={
            canCreate ? <NewExpenseReportModalButton assoSlug={assoSlug} /> : undefined
          }
        />
      ) : (
        <>
          {canCreate && (
            <div className="mb-6">
              <NewExpenseReportModalButton assoSlug={assoSlug} />
            </div>
          )}
          <ExpenseReportsList assoSlug={assoSlug} reports={reports} />
        </>
      )}
    </div>
  );
}
