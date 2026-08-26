import { redirect } from "next/navigation";
import { prepareExpenseReportValidation } from "@/lib/admin/expense-report-validation-preparation";
import { ValidateExpenseReportEditor } from "./_components/validate-expense-report-editor";

export default async function AdminValidateExpenseReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const preparation = await prepareExpenseReportValidation(reportId);

  if (preparation.status !== "TAKEN_OVER") {
    redirect(`/app/admin/notes-de-frais/${reportId}/remboursements`);
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Valider la Note de frais</h2>
        <p className="mt-1 max-w-3xl text-sm text-base-content/70">
          Vérifiez chaque document ci-dessous et corrigez-le si besoin avant
          de confirmer. La validation est définitive : la Note devient
          immuable, le Solde et les Subventions concernées sont mis à jour,
          l&apos;IBAN est supprimé.
        </p>
      </div>
      <ValidateExpenseReportEditor
        reportId={preparation.reportId}
        groups={preparation.groups}
      />
    </section>
  );
}
