import Link from "next/link";
import {
  Download,
  FileText,
  HandCoins,
  Pencil,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { formatCents } from "@/lib/money";
import { fundingSourceLabel } from "@/lib/expense-reports/labels";
import {
  expenseReportStepHref,
  guardExpenseReportSummary,
  loadExpenseReportWizard,
} from "@/lib/expense-reports/expense-report-wizard";
import { updateExpenseReportAction } from "@/lib/expense-reports/expense-report-actions";
import { GeneralInformationModal } from "@/components/expense-reports/general-information-modal";

const dateFormatter = new Intl.DateTimeFormat("fr-FR");

export default async function ExpenseReportSummaryPage({
  params,
}: {
  params: Promise<{ assoSlug: string; reportId: string }>;
}) {
  const { assoSlug, reportId } = await params;
  const context = await loadExpenseReportWizard(assoSlug, reportId);
  guardExpenseReportSummary(context, assoSlug, reportId);
  const { report } = context;
  const total = report.lines.reduce((sum, line) => sum + line.amountCents, 0);
  const warnings = [...new Set(report.lines.flatMap((line) => line.warnings))];
  const beneficiaryName =
    report.beneficiaryFirstname && report.beneficiaryLastname
      ? `${report.beneficiaryFirstname} ${report.beneficiaryLastname}`
      : "Non renseigné";

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Récapitulatif</h2>
        <p className="mt-1 text-sm text-base-content/70">
          Vérifiez toutes les informations avant de soumettre la Note de frais.
        </p>
      </div>

      <SummarySection
        title="Informations générales"
        action={
          context.editable && (
            <GeneralInformationModal
              assoSlug={assoSlug}
              reportId={reportId}
              title={report.title}
              description={report.description}
              action={updateExpenseReportAction}
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
          context.editable && (
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
        <p className="font-medium">{beneficiaryName}</p>
        <p className="mt-1 text-sm text-base-content/70">
          IBAN :{" "}
          {report.beneficiaryIbanLast4
            ? `•••• ${report.beneficiaryIbanLast4}`
            : "non renseigné"}
        </p>
      </SummarySection>

      <SummarySection
        title="Dépenses"
        action={
          context.editable && (
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
          context.editable && (
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

      {context.pdfs.length > 0 && (
        <SummarySection title="Documents finaux">
          <ul className="space-y-2">
            {context.pdfs.map((pdf) => (
              <li key={pdf.id}>
                <a
                  className="link link-hover flex items-center gap-2"
                  href={`/app/${assoSlug}/notes-de-frais/${reportId}/pdfs/${pdf.id}`}
                >
                  <Download size={16} />
                  {pdf.subventionReason ?? fundingSourceLabel[pdf.fundingSource]}
                </a>
              </li>
            ))}
          </ul>
        </SummarySection>
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
