import Link from "next/link";
import {
  FileText,
  HandCoins,
  Pencil,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { formatCents } from "@/lib/money";
import {
  expenseReportStepHref,
  guardExpenseReportWizardStep,
  loadExpenseReportWizard,
} from "@/lib/expense-reports/expense-report-wizard";
import { DeleteExpenseReportButton } from "../_components/delete-expense-report-button";
import { GeneralInformationModal } from "../_components/general-information-modal";
import { SubmitExpenseReportForm } from "../_components/submit-expense-report-form";

const dateFormatter = new Intl.DateTimeFormat("fr-FR");

export default async function ExpenseReportSummaryPage({
  params,
}: {
  params: Promise<{ assoSlug: string; reportId: string }>;
}) {
  const { assoSlug, reportId } = await params;
  const context = await loadExpenseReportWizard(assoSlug, reportId);
  guardExpenseReportWizardStep(context, "recapitulatif", assoSlug, reportId);
  const { report } = context;
  const total = report.lines.reduce((sum, line) => sum + line.amountCents, 0);
  const warnings = [...new Set(report.lines.flatMap((line) => line.warnings))];
  const beneficiaryName =
    report.beneficiaryFirstname && report.beneficiaryLastname
      ? `${report.beneficiaryFirstname} ${report.beneficiaryLastname}`
      : "Bénéficiaires historiques";

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Récapitulatif</h2>
        <p className="mt-1 text-sm text-base-content/70">
          Vérifiez toutes les informations avant de soumettre la Note de frais.
        </p>
      </div>
      {context.legacyMultiBeneficiary && (
        <div className="alert alert-warning alert-soft">
          Cette ancienne Note contient plusieurs bénéficiaires. Elle est
          conservée en lecture seule dans son format historique.
        </div>
      )}

      <SummarySection
        title="Informations générales"
        action={
          context.editable && (
            <GeneralInformationModal
              assoSlug={assoSlug}
              reportId={reportId}
              title={report.title}
              description={report.description}
            />
          )
        }
      >
        <p className="font-medium">{report.title}</p>
        {report.description && (
          <p className="mt-1 text-sm text-base-content/70">
            {report.description}
          </p>
        )}
      </SummarySection>

      <SummarySection
        title="Bénéficiaire"
        action={
          context.editable &&
          !context.legacyMultiBeneficiary && (
            <Link
              className="btn btn-ghost btn-sm"
              href={expenseReportStepHref(assoSlug, reportId, "beneficiaire")}
            >
              <Pencil size={15} />
              Modifier
            </Link>
          )
        }
      >
        {context.legacyMultiBeneficiary ? (
          <ul className="list-disc pl-5">
            {[
              ...new Set(
                report.lines.map(
                  (line) =>
                    `${line.beneficiaryFirstname} ${line.beneficiaryLastname}`,
                ),
              ),
            ].map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        ) : (
          <>
            <p className="font-medium">{beneficiaryName}</p>
            <p className="mt-1 text-sm text-base-content/70">
              IBAN :{" "}
              {report.beneficiaryIbanLast4
                ? `•••• ${report.beneficiaryIbanLast4}`
                : "non renseigné"}
            </p>
          </>
        )}
      </SummarySection>

      <SummarySection
        title="Remboursements"
        action={
          context.editable &&
          !context.legacyMultiBeneficiary && (
            <Link
              className="btn btn-ghost btn-sm"
              href={expenseReportStepHref(assoSlug, reportId, "remboursements")}
            >
              <Pencil size={15} />
              Modifier
            </Link>
          )
        }
      >
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Date</th>
                <th>Dépense</th>
                <th>Financement</th>
                <th className="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {report.lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    {line.expenseDate
                      ? dateFormatter.format(line.expenseDate)
                      : "—"}
                  </td>
                  <td>{line.expenseName}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5">
                      {line.subventionReason ? (
                        <HandCoins size={14} className="text-base-content/50" />
                      ) : (
                        <Wallet size={14} className="text-base-content/50" />
                      )}
                      {line.subventionReason ?? "Solde"}
                    </span>
                  </td>
                  <td className="text-right">
                    {formatCents(line.amountCents)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={3} className="text-right">
                  Total
                </th>
                <th className="text-right">{formatCents(total)}</th>
              </tr>
            </tfoot>
          </table>
        </div>
        {warnings.length > 0 && (
          <div className="alert alert-warning alert-soft mt-3">
            <TriangleAlert size={18} />
            <ul className="list-disc pl-4">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </SummarySection>

      <SummarySection
        title="Justificatifs"
        action={
          context.editable &&
          !context.legacyMultiBeneficiary && (
            <Link
              className="btn btn-ghost btn-sm"
              href={expenseReportStepHref(assoSlug, reportId, "justificatifs")}
            >
              <Pencil size={15} />
              Modifier
            </Link>
          )
        }
      >
        <ul className="space-y-2">
          {report.supportingDocuments.map((document) => (
            <li key={document.id}>
              <a
                className="link link-hover flex items-center gap-2"
                target="_blank"
                href={`/app/${assoSlug}/notes-de-frais/${reportId}/justificatifs/${document.id}`}
              >
                <FileText size={16} />
                {document.originalFilename}
              </a>
            </li>
          ))}
        </ul>
      </SummarySection>

      {report.status === "DRAFT" && (
        <div className="flex items-center justify-between gap-3">
          <DeleteExpenseReportButton
            assoSlug={assoSlug}
            reportId={reportId}
            title={report.title}
          />
          {context.completion.recapitulatif &&
            !context.legacyMultiBeneficiary && (
              <SubmitExpenseReportForm
                assoSlug={assoSlug}
                reportId={reportId}
                beneficiaryName={beneficiaryName}
                reimbursementsCount={report.lines.length}
                totalAmountCents={total}
                documentsCount={report.supportingDocuments.length}
                warnings={warnings}
              />
            )}
        </div>
      )}
      {report.status === "SUBMITTED" && (
        <div className="alert alert-success alert-soft">
          Cette Note de frais a été soumise. Vous pouvez encore la modifier tant
          que l&apos;Admin CLA ne l&apos;a pas prise en charge.
        </div>
      )}
    </section>
  );
}

function SummarySection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
