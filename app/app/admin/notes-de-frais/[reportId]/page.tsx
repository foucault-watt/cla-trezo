import Link from "next/link";
import { FileText } from "lucide-react";
import { listActiveAssoMembers } from "@/lib/asso/members";
import { getExpenseReportDetailForAdmin } from "@/lib/admin/expense-reports";
import {
  addExpenseReportLineAsAdminAction,
  addReimbursementAsAdminAction,
  deleteExpenseReportLineAsAdminAction,
  deleteReimbursementAsAdminAction,
  updateExpenseReportLineAsAdminAction,
  updateReimbursementAsAdminAction,
} from "@/lib/admin/expense-report-actions";
import {
  assertExpenseReportMutable,
  ExpenseReportLifecycleError,
} from "@/lib/expense-reports/expense-report-lifecycle";
import { ExpenseReportDetailHeader } from "@/components/expense-reports/expense-report-detail-view";
import { PersonGroupsBoard } from "@/components/expense-reports/person-groups-board";
import { ReimbursementsTable } from "@/app/app/[assoSlug]/notes-de-frais/[reportId]/_components/reimbursements-table";
import { TakeOverButton } from "./_components/take-over-button";
import { AdminBeneficiaryModal } from "./_components/beneficiary-modal";

function documentUrl(reportId: string, documentId: string) {
  return `/app/admin/notes-de-frais/${reportId}/justificatifs/${documentId}`;
}

export default async function AdminExpenseReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const report = await getExpenseReportDetailForAdmin(reportId);
  const members = await listActiveAssoMembers(report.assoId);
  const hasUniqueBeneficiary = Boolean(
    report.beneficiaryFirstname && report.beneficiaryLastname,
  );

  let editable = true;
  try {
    assertExpenseReportMutable({
      status: report.status,
      actor: { type: "ADMIN" },
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    editable = false;
  }

  return (
    <div>
      <Link
        href="/app/admin/notes-de-frais"
        className="link link-hover text-sm text-base-content/70"
      >
        ← Toutes les Notes de frais
      </Link>

      <ExpenseReportDetailHeader
        report={report}
        subtitle={
          <p className="mt-1 text-sm text-base-content/70">{report.assoName}</p>
        }
      />

      <section className="card mt-6 border border-base-300 bg-base-100 shadow-md">
        <div className="card-body gap-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="card-title">Bénéficiaire</h2>
            {editable && hasUniqueBeneficiary && report.beneficiaryIban && (
              <AdminBeneficiaryModal
                reportId={report.id}
                firstname={report.beneficiaryFirstname as string}
                lastname={report.beneficiaryLastname as string}
                iban={report.beneficiaryIban}
              />
            )}
          </div>
          {hasUniqueBeneficiary ? (
            <>
              <p className="font-medium">
                {report.beneficiaryFirstname} {report.beneficiaryLastname}
              </p>
              <p className="font-mono text-sm text-base-content/70">
                {report.beneficiaryIban ?? "IBAN supprimé après finalisation"}
              </p>
            </>
          ) : (
            <div className="alert alert-warning alert-soft">
              Cette ancienne Note contient plusieurs bénéficiaires et reste
              consultable dans son format historique.
            </div>
          )}
        </div>
      </section>

      <div className="mt-6">
        {hasUniqueBeneficiary ? (
          <ReimbursementsTable
            assoSlug={report.assoSlug}
            expenseReportId={report.id}
            lines={report.lines}
            assoType={report.assoType}
            typeDepenses={report.typeDepenses}
            visibleSubventions={report.visibleSubventions}
            soldeView={report.soldeView}
            editable={editable}
            addAction={addReimbursementAsAdminAction}
            updateAction={updateReimbursementAsAdminAction}
            deleteAction={deleteReimbursementAsAdminAction}
          />
        ) : (
          <PersonGroupsBoard
            addAction={addExpenseReportLineAsAdminAction}
            updateAction={updateExpenseReportLineAsAdminAction}
            deleteAction={deleteExpenseReportLineAsAdminAction}
            expenseReportId={report.id}
            lines={report.lines}
            members={members}
            assoType={report.assoType}
            typeDepenses={report.typeDepenses}
            visibleSubventions={report.visibleSubventions}
            editable={false}
            showIbanColumn
          />
        )}
      </div>

      <div className="card mt-6 border border-base-300 bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Justificatifs</h2>
          {report.supportingDocuments.length === 0 ? (
            <p className="text-sm text-base-content/70">
              Aucun Justificatif pour l&apos;instant.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {report.supportingDocuments.map((document) => {
                const url = documentUrl(report.id, document.id);
                const isImage = document.mimeType.startsWith("image/");
                return (
                  <li
                    key={document.id}
                    className="flex items-center gap-3 rounded-box border border-base-300 p-2"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center gap-3 overflow-hidden"
                    >
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element -- fichier servi dynamiquement par un Route Handler, pas un asset next/image.
                        <img
                          src={url}
                          alt=""
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <FileText className="size-8 shrink-0 text-base-content/60" />
                      )}
                      <span className="truncate text-sm">
                        {document.originalFilename}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {report.status === "SUBMITTED" && (
        <div className="mt-6">
          <TakeOverButton reportId={report.id} />
        </div>
      )}
    </div>
  );
}
