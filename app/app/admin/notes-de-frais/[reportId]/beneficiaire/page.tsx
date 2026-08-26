import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { listActiveAssoMembers } from "@/lib/asso/members";
import {
  getExpenseReportDetailForAdmin,
  isExpenseReportEditableByAdmin,
} from "@/lib/admin/expense-reports";
import { AdminBeneficiaryForm } from "../_components/admin-beneficiary-form";
import { RejectButton } from "../_components/reject-button";

export default async function AdminBeneficiaryPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const report = await getExpenseReportDetailForAdmin(reportId);
  const editable = isExpenseReportEditableByAdmin(report.status);

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Bénéficiaire</h2>
        <p className="mt-1 text-sm text-base-content/70">
          Destinataire du remboursement et son IBAN.
        </p>
      </div>

      {editable ? (
        <AdminBeneficiaryForm
          reportId={reportId}
          members={await listActiveAssoMembers(report.assoId)}
          beneficiary={{
            userId: report.beneficiaryUserId,
            firstname: report.beneficiaryFirstname ?? "",
            lastname: report.beneficiaryLastname ?? "",
            iban: report.beneficiaryIban ?? "",
          }}
        />
      ) : (
        <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-md sm:p-6">
          <p className="font-medium">
            {report.beneficiaryFirstname} {report.beneficiaryLastname}
          </p>
          <p className="mt-1 font-mono text-sm text-base-content/70">
            {report.beneficiaryIban ?? "IBAN supprimé après finalisation"}
          </p>
        </section>
      )}
      {report.status === "TAKEN_OVER" && (
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <RejectButton reportId={reportId} />
          <Link
            href={`/app/admin/notes-de-frais/${reportId}/valider`}
            className="btn btn-primary"
          >
            <CheckCircle2 size={18} />
            Valider la note de frais
          </Link>
        </div>
      )}
    </section>
  );
}
