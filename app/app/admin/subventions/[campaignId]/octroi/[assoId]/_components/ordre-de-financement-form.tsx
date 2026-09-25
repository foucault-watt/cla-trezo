"use client";

import { useState } from "react";
import { grantDocumentTotal } from "@/lib/admin/grant-document-total";
import type { FinancementPdfData } from "@/pdf-lab/templates/financement/types";
import { GenerateGrantDocumentButton } from "./generate-grant-document-button";

type TextField = Exclude<keyof FinancementPdfData, "expenses">;

export function OrdreDeFinancementForm({
  campaignId,
  assoId,
  canGenerate,
  label,
  initialData,
}: {
  campaignId: string;
  assoId: string;
  canGenerate: boolean;
  label: string;
  initialData: FinancementPdfData;
}) {
  const [data, setData] = useState(initialData);

  function field(key: TextField, legend: string, hint?: string) {
    return (
      <fieldset className="fieldset">
        <legend className="fieldset-legend">{legend}</legend>
        <input
          className="input w-full"
          value={data[key]}
          onChange={(event) =>
            setData((current) => ({ ...current, [key]: event.target.value }))
          }
        />
        {hint && <p className="label">{hint}</p>}
      </fieldset>
    );
  }

  function updateExpense(
    index: number,
    key: "date" | "description" | "amount",
    value: string,
  ) {
    setData((current) => {
      const expenses = current.expenses.map((expense, itemIndex) =>
        itemIndex === index ? { ...expense, [key]: value } : expense,
      );
      const total = grantDocumentTotal(expenses) ?? current.total;
      return { ...current, expenses, total };
    });
  }

  function validationError() {
    if (!canGenerate) {
      return "Publiez d’abord la Campagne pour générer l’ordre de financement.";
    }
    if (!data.responsibleName.trim()) {
      return "Renseignez le responsable de la Structure.";
    }
    if (!data.secretaryName.trim()) {
      return "Renseignez le secrétaire général de CLA.";
    }
    if (!data.usageDeadline.trim()) {
      return "Renseignez la date limite d’utilisation.";
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="card card-border bg-base-100">
        <div className="card-body gap-5">
          <div>
            <h2 className="card-title">Informations à vérifier</h2>
            <p className="text-sm text-base-content/60">
              Le responsable est prérempli depuis les membres actifs lorsque le
              rôle est trouvé. La date limite vaut par défaut un an après la
              génération.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {field("responsibleName", "Responsable de la Structure")}
            {field(
              "usageDeadline",
              "Date limite d’utilisation",
              "« La subvention est utilisable jusqu’au … »",
            )}
          </div>
        </div>
      </div>

      <details className="collapse collapse-arrow border border-base-300 bg-base-100">
        <summary className="collapse-title font-medium">
          Afficher plus — modifier les informations préremplies
        </summary>
        <div className="collapse-content space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {field("period", "Période")}
            {field("associationName", "Nom de la Structure")}
            {field("associationStatus", "Statut")}
          </div>
          {field(
            "requestContext",
            "Contexte de la demande",
            "« Suite à la demande de … de l’association »",
          )}
          {field("secretaryName", "Secrétaire général de CLA")}

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold">Lignes de la subvention</h3>
              <p className="text-sm text-base-content/60">
                Le total est recalculé après chaque modification de montant.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.map((expense, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          className="input input-sm min-w-36"
                          value={expense.date}
                          onChange={(event) =>
                            updateExpense(index, "date", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input input-sm min-w-64 w-full"
                          value={expense.description}
                          onChange={(event) =>
                            updateExpense(
                              index,
                              "description",
                              event.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input input-sm min-w-32"
                          value={expense.amount}
                          onChange={(event) =>
                            updateExpense(index, "amount", event.target.value)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={2}>Total</th>
                    <th>{data.total}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </details>

      <GenerateGrantDocumentButton
        campaignId={campaignId}
        assoId={assoId}
        data={data}
        label={label}
        validationError={validationError}
      />
    </div>
  );
}
