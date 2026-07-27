import Link from "next/link";
import { FileText } from "lucide-react";
import { getExpenseReportDetailForAdmin } from "@/lib/admin/expense-reports";
import {
  expenseReportStatusBadgeClass,
  expenseReportStatusLabel,
  fundingSourceLabel,
} from "@/lib/expense-reports/labels";
import { formatCents } from "@/lib/money";
import { TakeOverButton } from "./_components/take-over-button";

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

  const totalAmountCents = report.lines.reduce(
    (sum, line) => sum + line.amountCents,
    0,
  );

  return (
    <div>
      <Link
        href="/app/admin/notes-de-frais"
        className="link link-hover text-sm text-base-content/70"
      >
        ← Toutes les Notes de frais
      </Link>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{report.title}</h1>
          <p className="mt-1 text-sm text-base-content/70">
            {report.assoName}
          </p>
          {report.description && (
            <p className="mt-1 text-sm text-base-content/70">
              {report.description}
            </p>
          )}
        </div>
        <span
          className={`badge ${expenseReportStatusBadgeClass[report.status]}`}
        >
          {expenseReportStatusLabel[report.status]}
        </span>
      </div>

      <div className="stats stats-vertical mt-6 w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal">
        <div className="stat">
          <div className="stat-title">Lignes</div>
          <div className="stat-value text-2xl">{report.lines.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Montant total</div>
          <div className="stat-value text-2xl">
            {formatCents(totalAmountCents)}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-md">
        <table className="table">
          <thead>
            <tr>
              <th>Bénéficiaire</th>
              <th>IBAN</th>
              <th>Nom de la dépense</th>
              <th>Type de dépense</th>
              <th>Montant</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {report.lines.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-base-content/70">
                  Aucune Ligne pour l&apos;instant.
                </td>
              </tr>
            ) : (
              report.lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    {line.beneficiaryFirstname} {line.beneficiaryLastname}
                  </td>
                  <td>{line.iban ?? "—"}</td>
                  <td>{line.expenseName}</td>
                  <td>{line.typeDepenseLabel ?? line.customLabel}</td>
                  <td>{formatCents(line.amountCents)}</td>
                  <td>
                    {line.fundingSource === "SUBVENTION" &&
                    line.subventionReason
                      ? `${fundingSourceLabel[line.fundingSource]} — ${line.subventionReason}`
                      : fundingSourceLabel[line.fundingSource]}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
