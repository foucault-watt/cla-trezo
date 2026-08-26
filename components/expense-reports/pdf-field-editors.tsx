"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ExpenseRow } from "@/pdf-lab/templates/ndf-fn-sb/types";

/**
 * Champs de saisie partagés par les éditeurs de PDF final (Subvention et
 * Solde) de la page de validation Admin — même forme que les éditeurs de
 * l'atelier pdf-lab (cf. app/app/admin/developpement/pdf-lab/_components),
 * mais contrôlés depuis un parent au lieu de porter leur propre état, pour
 * que la Server Action de validation puisse lire les valeurs de tous les
 * documents au moment de la confirmation.
 */
export function PdfTextField({
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

export function PdfExpenseRowsEditor({
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

export type PdfPaymentAndSignatureData = {
  paymentMethod: "cash" | "cheque" | "transfer";
  chequeOrder?: string;
  iban?: string;
  recipientName: string;
  treasurerName: string;
};

/**
 * Carte "Règlement et signatures" partagée par SubventionPdfFields et
 * SoldePdfFields (validate-expense-report-editor.tsx) : les cinq champs sont
 * identiques entre ExpenseReportPdfData et ExpenseBalancePdfData.
 */
export function PdfPaymentAndSignatureFields<
  Data extends PdfPaymentAndSignatureData,
>({ data, onChange }: { data: Data; onChange: (data: Data) => void }) {
  function updateField<K extends keyof PdfPaymentAndSignatureData>(
    field: K,
    value: PdfPaymentAndSignatureData[K],
  ) {
    onChange({ ...data, [field]: value });
  }

  return (
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
                  event.target.value as PdfPaymentAndSignatureData["paymentMethod"],
                )
              }
            >
              <option value="cash">Espèces</option>
              <option value="cheque">Chèque</option>
              <option value="transfer">Virement</option>
            </select>
          </fieldset>
          <PdfTextField
            label="Ordre du chèque"
            value={data.chequeOrder ?? ""}
            onChange={(value) => updateField("chequeOrder", value)}
          />
          <PdfTextField
            label="IBAN"
            value={data.iban ?? ""}
            onChange={(value) => updateField("iban", value)}
          />
          <PdfTextField
            label="Destinataire"
            value={data.recipientName}
            onChange={(value) => updateField("recipientName", value)}
          />
          <PdfTextField
            label="Trésorier de CLA"
            value={data.treasurerName}
            onChange={(value) => updateField("treasurerName", value)}
          />
        </div>
      </div>
    </div>
  );
}

export async function downloadPdfPreview({
  url,
  data,
  filename,
}: {
  url: string;
  data: unknown;
  filename: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    return {
      ok: false,
      error: payload?.error ?? "La génération du PDF a échoué.",
    };
  }

  const blobUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(blobUrl);
  return { ok: true };
}
