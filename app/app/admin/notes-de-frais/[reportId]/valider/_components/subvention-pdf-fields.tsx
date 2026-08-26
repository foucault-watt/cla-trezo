"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { ExpenseReportPdfData } from "@/pdf-lab/templates/ndf-fn-sb/types";
import {
  downloadPdfPreview,
  PdfExpenseRowsEditor,
  PdfPaymentAndSignatureFields,
  PdfTextField,
} from "@/components/expense-reports/pdf-field-editors";

/**
 * Édition complète (comme l'atelier pdf-lab) du PDF final d'un groupe
 * Subvention avant confirmation de la Validation — cf.
 * validate-expense-report-editor.tsx, qui lit `data` de chaque document au
 * moment de la confirmation.
 */
export function SubventionPdfFields({
  data,
  onChange,
}: {
  data: ExpenseReportPdfData;
  onChange: (data: ExpenseReportPdfData) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ExpenseReportPdfData>(
    field: K,
    value: ExpenseReportPdfData[K],
  ) {
    onChange({ ...data, [field]: value });
  }

  async function previewPdf() {
    setPending(true);
    setError(null);
    const result = await downloadPdfPreview({
      url: "/app/admin/developpement/pdf-lab/download",
      data,
      filename: "note-de-frais-fn-sb.pdf",
    });
    if (!result.ok) setError(result.error);
    setPending(false);
  }

  return (
    <div className="space-y-6">
      <div className="card card-border bg-base-100">
        <div className="card-body">
          <h2 className="card-title">Informations générales</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <PdfTextField
              label="Date de la note"
              value={data.reportDate}
              onChange={(value) => updateField("reportDate", value)}
            />
            <PdfTextField
              label="Auteur"
              value={data.authorName}
              onChange={(value) => updateField("authorName", value)}
            />
            <PdfTextField
              label="Financement"
              value={data.fundingName}
              onChange={(value) => updateField("fundingName", value)}
            />
            <PdfTextField
              label="Subvention"
              value={data.grantName}
              onChange={(value) => updateField("grantName", value)}
            />
            <PdfTextField
              label="Association à rembourser"
              value={data.associationName}
              onChange={(value) => updateField("associationName", value)}
            />
            <PdfTextField
              label="Association déjà remboursée"
              value={data.reimbursedAssociationName}
              onChange={(value) =>
                updateField("reimbursedAssociationName", value)
              }
            />
          </div>
        </div>
      </div>

      <PdfExpenseRowsEditor
        title="Financement accordé"
        dateLabel="Accordé le"
        rows={data.grantedExpenses}
        onChange={(rows) => updateField("grantedExpenses", rows)}
      />
      <PdfExpenseRowsEditor
        title="Frais déjà remboursés"
        dateLabel="Payé le"
        rows={data.reimbursedExpenses}
        onChange={(rows) => updateField("reimbursedExpenses", rows)}
      />
      <PdfExpenseRowsEditor
        title="Frais à rembourser"
        dateLabel="Date facture"
        rows={data.expensesToReimburse}
        onChange={(rows) => updateField("expensesToReimburse", rows)}
      />

      <div className="card card-border bg-base-100">
        <div className="card-body gap-4">
          <h2 className="card-title">Totaux</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PdfTextField
              label="Total accordé"
              value={data.grantedTotal}
              onChange={(value) => updateField("grantedTotal", value)}
            />
            <PdfTextField
              label="Total restant"
              value={data.remainingTotal}
              onChange={(value) => updateField("remainingTotal", value)}
            />
            <PdfTextField
              label="Total à rembourser"
              value={data.reimbursementTotal}
              onChange={(value) => updateField("reimbursementTotal", value)}
            />
            <PdfTextField
              label="Solde de la subvention"
              value={data.grantBalance}
              onChange={(value) => updateField("grantBalance", value)}
            />
          </div>
        </div>
      </div>

      <PdfPaymentAndSignatureFields data={data} onChange={onChange} />

      {error && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-soft"
          onClick={previewPdf}
          disabled={pending}
        >
          {pending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <Download size={18} />
          )}
          {pending ? "Génération…" : "Aperçu PDF"}
        </button>
      </div>
    </div>
  );
}
