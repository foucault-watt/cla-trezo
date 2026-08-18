"use client";

import { useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import type {
  ExpenseReportPdfData,
  ExpenseRow,
} from "@/pdf-lab/templates/ndf-fn-sb/types";

type RowsField =
  "grantedExpenses" | "reimbursedExpenses" | "expensesToReimburse";

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date";
}) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{label}</legend>
      <input
        className="input w-full"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </fieldset>
  );
}

function ExpenseRowsEditor({
  title,
  dateLabel,
  rows,
  onChange,
}: {
  title: string;
  dateLabel: string;
  rows: ExpenseRow[];
  onChange: (rows: ExpenseRow[]) => void;
}) {
  function updateRow(index: number, field: keyof ExpenseRow, value: string) {
    onChange(
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  function addRow() {
    onChange([...rows, { date: "", description: "", amount: "0,00 €" }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <div className="card card-border bg-base-100">
      <div className="card-body gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="card-title">{title}</h2>
            <p className="text-sm text-base-content/60">
              {rows.length} ligne{rows.length > 1 ? "s" : ""}
            </p>
          </div>
          <button type="button" className="btn btn-sm" onClick={addRow}>
            <Plus size={16} />
            Ajouter une ligne
          </button>
        </div>

        {rows.length === 0 ? (
          <div role="alert" className="alert alert-soft">
            <span>
              Ce tableau est vide. Ajoutez une ligne pour afficher une dépense
              dans le PDF.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>{dateLabel}</th>
                  <th>Description</th>
                  <th>Montant</th>
                  <th className="w-12">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        className="input input-sm min-w-36"
                        value={row.date}
                        aria-label={`${dateLabel}, ligne ${index + 1}`}
                        onChange={(event) =>
                          updateRow(index, "date", event.target.value)
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        className="input input-sm min-w-64 w-full"
                        value={row.description}
                        aria-label={`Description, ligne ${index + 1}`}
                        onChange={(event) =>
                          updateRow(index, "description", event.target.value)
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        className="input input-sm min-w-28"
                        value={row.amount}
                        aria-label={`Montant, ligne ${index + 1}`}
                        onChange={(event) =>
                          updateRow(index, "amount", event.target.value)
                        }
                        required
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-square btn-sm"
                        aria-label={`Supprimer la ligne ${index + 1}`}
                        onClick={() => removeRow(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function PdfLabEditor({
  initialData,
}: {
  initialData: ExpenseReportPdfData;
}) {
  const [data, setData] = useState(initialData);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof ExpenseReportPdfData>(
    field: K,
    value: ExpenseReportPdfData[K],
  ) {
    setData((current) => ({ ...current, [field]: value }));
  }

  function updateRows(field: RowsField, rows: ExpenseRow[]) {
    updateField(field, rows);
  }

  async function downloadPdf() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(
        "/app/admin/developpement/pdf-lab/download",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "La génération du PDF a échoué.");
      }

      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "note-de-frais-fn-sb.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "La génération du PDF a échoué.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div role="alert" className="alert alert-warning alert-soft">
        <span>
          Atelier de développement : les valeurs sont conservées uniquement dans
          cet onglet.
        </span>
      </div>

      <div className="card card-border bg-base-100">
        <div className="card-body">
          <h2 className="card-title">Informations générales</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TextField
              label="Date de la note"
              value={data.reportDate}
              onChange={(value) => updateField("reportDate", value)}
            />
            <TextField
              label="Auteur"
              value={data.authorName}
              onChange={(value) => updateField("authorName", value)}
            />
            <TextField
              label="Financement"
              value={data.fundingName}
              onChange={(value) => updateField("fundingName", value)}
            />
            <TextField
              label="Subvention"
              value={data.grantName}
              onChange={(value) => updateField("grantName", value)}
            />
            <TextField
              label="Association à rembourser"
              value={data.associationName}
              onChange={(value) => updateField("associationName", value)}
            />
            <TextField
              label="Association déjà remboursée"
              value={data.reimbursedAssociationName}
              onChange={(value) =>
                updateField("reimbursedAssociationName", value)
              }
            />
          </div>
        </div>
      </div>

      <ExpenseRowsEditor
        title="Financement accordé"
        dateLabel="Accordé le"
        rows={data.grantedExpenses}
        onChange={(rows) => updateRows("grantedExpenses", rows)}
      />
      <ExpenseRowsEditor
        title="Frais déjà remboursés"
        dateLabel="Payé le"
        rows={data.reimbursedExpenses}
        onChange={(rows) => updateRows("reimbursedExpenses", rows)}
      />
      <ExpenseRowsEditor
        title="Frais à rembourser"
        dateLabel="Date facture"
        rows={data.expensesToReimburse}
        onChange={(rows) => updateRows("expensesToReimburse", rows)}
      />

      <div className="card card-border bg-base-100">
        <div className="card-body gap-4">
          <h2 className="card-title">Totaux</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TextField
              label="Total accordé"
              value={data.grantedTotal}
              onChange={(value) => updateField("grantedTotal", value)}
            />
            <TextField
              label="Total restant"
              value={data.remainingTotal}
              onChange={(value) => updateField("remainingTotal", value)}
            />
            <TextField
              label="Total à rembourser"
              value={data.reimbursementTotal}
              onChange={(value) => updateField("reimbursementTotal", value)}
            />
            <TextField
              label="Solde de la subvention"
              value={data.grantBalance}
              onChange={(value) => updateField("grantBalance", value)}
            />
          </div>
        </div>
      </div>

      <div className="card card-border bg-base-100">
        <div className="card-body gap-4">
          <h2 className="card-title">Règlement et signatures</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Mode de règlement</legend>
              <select
                className="select w-full"
                value={data.paymentMethod}
                onChange={(event) =>
                  updateField(
                    "paymentMethod",
                    event.target.value as ExpenseReportPdfData["paymentMethod"],
                  )
                }
              >
                <option value="cash">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="transfer">Virement</option>
              </select>
            </fieldset>
            <TextField
              label="Ordre du chèque"
              value={data.chequeOrder ?? ""}
              onChange={(value) => updateField("chequeOrder", value)}
            />
            <TextField
              label="IBAN"
              value={data.iban ?? ""}
              onChange={(value) => updateField("iban", value)}
            />
            <TextField
              label="Destinataire"
              value={data.recipientName}
              onChange={(value) => updateField("recipientName", value)}
            />
            <TextField
              label="Trésorier de CLA"
              value={data.treasurerName}
              onChange={(value) => updateField("treasurerName", value)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-primary"
          onClick={downloadPdf}
          disabled={pending}
        >
          {pending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <Download size={18} />
          )}
          {pending ? "Génération…" : "Télécharger le PDF"}
        </button>
      </div>
    </div>
  );
}
