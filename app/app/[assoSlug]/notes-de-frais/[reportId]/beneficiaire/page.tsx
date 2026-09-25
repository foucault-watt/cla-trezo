import { requireStructureAccess } from "@/lib/auth/guards";
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
  const [members, { user }] = await Promise.all([
    listActiveAssoMembers(context.assoId),
    requireStructureAccess(assoSlug),
  ]);
  const { report } = context;
  const totalAmountCents = report.lines.reduce(
    (sum, line) => sum + line.amountCents,
    0,
  );
  const warnings = [...new Set(report.lines.flatMap((line) => line.warnings))];

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Bénéficiaire</h2>
        <p className="mt-1 text-sm text-base-content/70">
          Indiquez qui recevra le remboursement, puis envoyez la demande.
        </p>
      </div>

      <BeneficiaryForm
        assoSlug={assoSlug}
        reportId={reportId}
        members={members}
        currentUserId={user.id}
        beneficiary={{
          userId: report.beneficiaryUserId,
          firstname: report.beneficiaryFirstname,
          lastname: report.beneficiaryLastname,
          ibanLast4: report.beneficiaryIbanLast4,
        }}
        reportStatus={report.status}
        reportTitle={report.title}
        reimbursementsCount={report.lines.length}
        totalAmountCents={totalAmountCents}
        documentsCount={report.supportingDocuments.length}
        warnings={warnings}
        backHref={expenseReportStepHref(assoSlug, reportId, "remboursements")}
      />
    </section>
  );
}
