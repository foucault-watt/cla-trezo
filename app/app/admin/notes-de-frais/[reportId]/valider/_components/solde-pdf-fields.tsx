"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { ExpenseBalancePdfData } from "@/pdf-lab/templates/ndf-solde/types";
import {
  downloadPdfPreview,
  PdfExpenseRowsEditor,
  PdfPaymentAndSignatureFields,
  PdfTextField,
} from "@/components/expense-reports/pdf-field-editors";

/**
 * Édition complète (comme l'atelier pdf-lab) du PDF final du groupe Solde
 * avant confirmation de la Validation — cf. SubventionPdfFields, son
 * équivalent pour un groupe Subvention.
 */
export function SoldePdfFields({
  data,
  onChange,
}: {
  data: ExpenseBalancePdfData;
  onChange: (data: ExpenseBalancePdfData) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ExpenseBalancePdfData>(
    field: K,
    value: ExpenseBalancePdfData[K],
  ) {
    onChange({ ...data, [field]: value });
  }

  async function previewPdf() {
    setPending(true);
    setError(null);
    const result = await downloadPdfPreview({
      url: "/app/admin/developpement/pdf-lab/download/ndf-solde",
      data,
      filename: "note-de-frais-solde.pdf",
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
              label="Association à rembourser"
              value={data.associationName}
              onChange={(value) => updateField("associationName", value)}
            />
          </div>
        </div>
      </div>

      <PdfExpenseRowsEditor
        title="Frais à rembourser"
        dateLabel="Date facture"
        rows={data.expenses}
        onChange={(rows) => updateField("expenses", rows)}
      />

      <div className="card card-border bg-base-100">
        <div className="card-body gap-4">
          <h2 className="card-title">Total</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <PdfTextField
              label="Total TTC"
              value={data.total}
              onChange={(value) => updateField("total", value)}
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
