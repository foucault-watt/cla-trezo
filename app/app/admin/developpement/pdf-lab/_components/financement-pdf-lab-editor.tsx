"use client";

import { useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import type {
  FinancementExpenseRow,
  FinancementPdfData,
} from "@/pdf-lab/templates/financement/types";

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{label}</legend>
      <input
        className="input w-full"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </fieldset>
  );
}

function ExpenseRowsEditor({
  rows,
  onChange,
}: {
  rows: FinancementExpenseRow[];
  onChange: (rows: FinancementExpenseRow[]) => void;
}) {
  function updateRow(
    index: number,
    field: keyof FinancementExpenseRow,
    value: string,
  ) {
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
            <h2 className="card-title">Dépenses accordées</h2>
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
              Ce tableau est vide. Ajoutez une ligne pour afficher une
              dépense dans le PDF.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Accordé le</th>
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
                        aria-label={`Accordé le, ligne ${index + 1}`}
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

export function FinancementPdfLabEditor({
  initialData,
}: {
  initialData: FinancementPdfData;
}) {
  const [data, setData] = useState(initialData);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FinancementPdfData>(
    field: K,
    value: FinancementPdfData[K],
  ) {
    setData((current) => ({ ...current, [field]: value }));
  }

  async function downloadPdf() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(
        "/app/admin/developpement/pdf-lab/download/financement",
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
      link.download = "ordre-de-financement.pdf";
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
          Atelier de développement : les valeurs sont conservées uniquement
          dans cet onglet.
        </span>
      </div>

      <div className="card card-border bg-base-100">
        <div className="card-body">
          <h2 className="card-title">Informations générales</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TextField
              label="Période"
              value={data.period}
              onChange={(value) => updateField("period", value)}
            />
            <TextField
              label="Association"
              value={data.associationName}
              onChange={(value) => updateField("associationName", value)}
            />
            <TextField
              label="Statut"
              value={data.associationStatus}
              onChange={(value) => updateField("associationStatus", value)}
            />
            <TextField
              label="Contexte de la demande"
              value={data.requestContext}
              onChange={(value) => updateField("requestContext", value)}
            />
            <TextField
              label="Date limite d’utilisation"
              value={data.usageDeadline}
              onChange={(value) => updateField("usageDeadline", value)}
            />
          </div>
        </div>
      </div>

      <ExpenseRowsEditor
        rows={data.expenses}
        onChange={(rows) => updateField("expenses", rows)}
      />

      <div className="card card-border bg-base-100">
        <div className="card-body gap-4">
          <h2 className="card-title">Total et signataires</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <TextField
              label="Total"
              value={data.total}
              onChange={(value) => updateField("total", value)}
            />
            <TextField
              label="Responsable de l’association"
              value={data.responsibleName}
              onChange={(value) => updateField("responsibleName", value)}
            />
            <TextField
              label="Secrétaire général de CLA"
              value={data.secretaryName}
              onChange={(value) => updateField("secretaryName", value)}
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
