import { listActiveAssoMembers } from "@/lib/asso/members";
import {
  expenseReportStepHref,
  guardExpenseReportWizardStep,
  loadExpenseReportWizard,
} from "@/lib/expense-reports/expense-report-wizard";
import { BeneficiaryForm } from "../_components/beneficiary-form";

export default async function BeneficiaryPage({
  params,
}: {
  params: Promise<{ assoSlug: string; reportId: string }>;
}) {
  const { assoSlug, reportId } = await params;
  const context = await loadExpenseReportWizard(assoSlug, reportId);
  guardExpenseReportWizardStep(context, "beneficiaire", assoSlug, reportId);
  const members = await listActiveAssoMembers(context.assoId);
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Bénéficiaire</h2>
        <p className="mt-1 text-sm text-base-content/70">
          Une Note de frais rembourse une seule personne.
        </p>
      </div>
      <BeneficiaryForm
        assoSlug={assoSlug}
        reportId={reportId}
        members={members}
        beneficiary={{
          userId: context.report.beneficiaryUserId,
          firstname: context.report.beneficiaryFirstname,
          lastname: context.report.beneficiaryLastname,
          ibanLast4: context.report.beneficiaryIbanLast4,
        }}
        backHref={expenseReportStepHref(assoSlug, reportId, "justificatifs")}
      />
    </section>
  );
}
