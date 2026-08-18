"use client";

import { useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import type {
  ConventionExpenseRow,
  ConventionParty,
  ConventionRepresentative,
  ConventionSignatureBlock,
  SubsidyConventionPdfData,
} from "@/pdf-lab/templates/convention/types";

type PartyKey = "firstParty" | "secondParty";
type SignatureKey = "firstPartySignature" | "secondPartySignature";

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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </fieldset>
  );
}

function PartyEditor({
  title,
  description,
  party,
  onChange,
}: {
  title: string;
  description: string;
  party: ConventionParty;
  onChange: (party: ConventionParty) => void;
}) {
  function updateRepresentative(
    index: number,
    field: keyof ConventionRepresentative,
    value: string,
  ) {
    onChange({
      ...party,
      representatives: party.representatives.map((representative, itemIndex) =>
        itemIndex === index
          ? { ...representative, [field]: value }
          : representative,
      ),
    });
  }

  function addRepresentative() {
    onChange({
      ...party,
      representatives: [...party.representatives, { name: "", role: "" }],
    });
  }

  function removeRepresentative(index: number) {
    onChange({
      ...party,
      representatives: party.representatives.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    });
  }

  return (
    <div className="card card-border bg-base-100">
      <div className="card-body gap-4">
        <div>
          <h2 className="card-title">{title}</h2>
          <p className="text-sm text-base-content/60">{description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Nom de l'association"
            value={party.associationName}
            onChange={(associationName) =>
              onChange({ ...party, associationName })
            }
          />
          <TextField
            label="Adresse"
            value={party.address}
            onChange={(address) => onChange({ ...party, address })}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Représentants</h3>
            <p className="text-sm text-base-content/60">
              {party.representatives.length} représentant
              {party.representatives.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={addRepresentative}
          >
            <Plus size={16} />
            Ajouter un représentant
          </button>
        </div>

        {party.representatives.length === 0 ? (
          <div role="alert" className="alert alert-soft">
            <span>Ajoutez au moins un représentant pour générer le PDF.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Fonction</th>
                  <th className="w-12">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {party.representatives.map((representative, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        className="input input-sm min-w-64 w-full"
                        value={representative.name}
                        aria-label={`Nom du représentant, ligne ${index + 1}`}
                        onChange={(event) =>
                          updateRepresentative(
                            index,
                            "name",
                            event.target.value,
                          )
                        }
                        required
                      />
                    </td>
                    <td>
                      <input
                        className="input input-sm min-w-48 w-full"
                        value={representative.role}
                        aria-label={`Fonction du représentant, ligne ${index + 1}`}
                        onChange={(event) =>
                          updateRepresentative(
                            index,
                            "role",
                            event.target.value,
                          )
                        }
                        required
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-square btn-sm"
                        aria-label={`Supprimer le représentant ${index + 1}`}
                        onClick={() => removeRepresentative(index)}
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

function ExpenseRowsEditor({
  rows,
  onChange,
}: {
  rows: ConventionExpenseRow[];
  onChange: (rows: ConventionExpenseRow[]) => void;
}) {
  function updateRow(
    index: number,
    field: keyof ConventionExpenseRow,
    value: string,
  ) {
    onChange(
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  function addRow() {
    onChange([...rows, { grantedOn: "", description: "", amount: "0,00 €" }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <div className="card card-border bg-base-100">
      <div className="card-body gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="card-title">Article 2 - Dépenses accordées</h2>
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
            <span>Le tableau sera affiché sans dépense.</span>
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
                        value={row.grantedOn}
                        aria-label={`Date d'accord, ligne ${index + 1}`}
                        onChange={(event) =>
                          updateRow(index, "grantedOn", event.target.value)
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

function SignatureEditor({
  title,
  signature,
  onChange,
}: {
  title: string;
  signature: ConventionSignatureBlock;
  onChange: (signature: ConventionSignatureBlock) => void;
}) {
  function updateField(field: keyof ConventionSignatureBlock, value: string) {
    onChange({ ...signature, [field]: value });
  }

  return (
    <div className="card card-border bg-base-100">
      <div className="card-body gap-4">
        <h2 className="card-title">{title}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Association"
            value={signature.associationName}
            onChange={(value) => updateField("associationName", value)}
          />
          <TextField
            label="Signataire"
            value={signature.signatoryName}
            onChange={(value) => updateField("signatoryName", value)}
          />
          <TextField
            label="Fonction"
            value={signature.signatoryRole}
            onChange={(value) => updateField("signatoryRole", value)}
          />
          <TextField
            label="Lieu"
            value={signature.city}
            onChange={(value) => updateField("city", value)}
          />
          <TextField
            label="Date"
            value={signature.date}
            onChange={(value) => updateField("date", value)}
          />
        </div>
      </div>
    </div>
  );
}

export function ConventionPdfLabEditor({
  initialData,
}: {
  initialData: SubsidyConventionPdfData;
}) {
  const [data, setData] = useState(initialData);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof SubsidyConventionPdfData>(
    field: K,
    value: SubsidyConventionPdfData[K],
  ) {
    setData((current) => ({ ...current, [field]: value }));
  }

  function updateParty(field: PartyKey, party: ConventionParty) {
    updateField(field, party);
  }

  function updateSignature(
    field: SignatureKey,
    signature: ConventionSignatureBlock,
  ) {
    updateField(field, signature);
  }

  async function downloadPdf() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(
        "/app/admin/developpement/pdf-lab/download/convention",
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
        throw new Error(
          payload?.error ?? "La génération de la convention a échoué.",
        );
      }

      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "convention-de-subvention.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "La génération de la convention a échoué.",
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
          cet onglet. Les emplacements de signature restent volontairement
          vides.
        </span>
      </div>

      <div className="card card-border bg-base-100">
        <div className="card-body">
          <h2 className="card-title">Informations générales</h2>
          <div className="max-w-md">
            <TextField
              label="Période"
              value={data.period}
              onChange={(value) => updateField("period", value)}
            />
          </div>
        </div>
      </div>

      <PartyEditor
        title="D'une part"
        description="Association émettrice, adresse et représentants."
        party={data.firstParty}
        onChange={(party) => updateParty("firstParty", party)}
      />
      <PartyEditor
        title="D'autre part"
        description="Association bénéficiaire, adresse et représentants."
        party={data.secondParty}
        onChange={(party) => updateParty("secondParty", party)}
      />

      <ExpenseRowsEditor
        rows={data.expenses}
        onChange={(rows) => updateField("expenses", rows)}
      />

      <div className="card card-border bg-base-100">
        <div className="card-body">
          <h2 className="card-title">Montant total</h2>
          <div className="max-w-md">
            <TextField
              label="Total de la subvention"
              value={data.totalAmount}
              onChange={(value) => updateField("totalAmount", value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SignatureEditor
          title="Signature de la première partie"
          signature={data.firstPartySignature}
          onChange={(signature) =>
            updateSignature("firstPartySignature", signature)
          }
        />
        <SignatureEditor
          title="Signature de la seconde partie"
          signature={data.secondPartySignature}
          onChange={(signature) =>
            updateSignature("secondPartySignature", signature)
          }
        />
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
          {pending ? "Génération…" : "Télécharger la convention"}
        </button>
      </div>
    </div>
  );
}
