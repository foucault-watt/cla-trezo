"use client";

import { useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { representativesForPrimarySection } from "@/lib/admin/convention-preparation-fields";
import { formatCents } from "@/lib/money";
import type {
  ConventionParty,
  ConventionRepresentative,
  ConventionSignatureBlock,
  SubsidyConventionPdfData,
} from "@/pdf-lab/templates/convention/types";

function parseFormattedAmount(value: string): number | null {
  const normalized = value.replace(/[\s\u00a0\u202f€]/g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

function BeneficiaryRepresentativeFields({
  representatives,
  onChange,
}: {
  representatives: ConventionRepresentative[];
  onChange: (representatives: ConventionRepresentative[]) => void;
}) {
  const primaryRepresentatives = representativesForPrimarySection(
    representatives,
  ).map((representative, index) => ({ representative, index }));

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Représentants bénéficiaires</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {primaryRepresentatives.map(({ representative, index }) => (
          <div
            className="space-y-3 rounded-box border border-base-300 p-3"
            key={index}
          >
            <h4 className="font-medium">
              {index === 0 ? "Présidence" : "Trésorerie"}
            </h4>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nom</legend>
              <input
                className="input w-full"
                value={representative.name}
                placeholder="Prénom NOM"
                onChange={(event) =>
                  onChange(
                    representatives.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Fonction</legend>
              <input
                className="input w-full"
                value={representative.role}
                onChange={(event) =>
                  onChange(
                    representatives.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, role: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </fieldset>
            <p className="label">
              Prérempli depuis les membres actifs lorsque le rôle est trouvé.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RepresentativesEditor({
  title,
  representatives,
  onChange,
}: {
  title: string;
  representatives: ConventionRepresentative[];
  onChange: (representatives: ConventionRepresentative[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => onChange([...representatives, { name: "", role: "" }])}
        >
          <Plus size={16} />
          Ajouter un représentant
        </button>
      </div>
      {representatives.map((representative, index) => (
        <div
          className="grid gap-3 rounded-box border border-base-300 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          key={index}
        >
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Nom</legend>
            <input
              className="input w-full"
              value={representative.name}
              onChange={(event) =>
                onChange(
                  representatives.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, name: event.target.value }
                      : item,
                  ),
                )
              }
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Fonction</legend>
            <input
              className="input w-full"
              value={representative.role}
              onChange={(event) =>
                onChange(
                  representatives.map((item, itemIndex) =>
                    itemIndex === index
                      ? { ...item, role: event.target.value }
                      : item,
                  ),
                )
              }
            />
          </fieldset>
          <button
            type="button"
            className="btn btn-ghost btn-square"
            aria-label={`Supprimer le représentant ${index + 1}`}
            onClick={() =>
              onChange(
                representatives.filter((_, itemIndex) => itemIndex !== index),
              )
            }
          >
            <Trash2 size={17} />
          </button>
        </div>
      ))}
    </div>
  );
}

function SignatureFields({
  signature,
  onChange,
}: {
  signature: ConventionSignatureBlock;
  onChange: (signature: ConventionSignatureBlock) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {(
        [
          ["signatoryName", "Nom du signataire"],
          ["signatoryRole", "Fonction"],
          ["city", "Ville"],
        ] as const
      ).map(([field, label]) => (
        <fieldset className="fieldset" key={field}>
          <legend className="fieldset-legend">{label}</legend>
          <input
            className="input w-full"
            value={signature[field]}
            onChange={(event) =>
              onChange({ ...signature, [field]: event.target.value })
            }
          />
        </fieldset>
      ))}
    </div>
  );
}

export function ConventionPreparationForm({
  campaignId,
  assoId,
  publicationDateMissing,
  initialData,
}: {
  campaignId: string;
  assoId: string;
  publicationDateMissing: boolean;
  initialData: SubsidyConventionPdfData;
}) {
  const [data, setData] = useState(initialData);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateParty(
    key: "firstParty" | "secondParty",
    party: ConventionParty,
  ) {
    setData((current) => ({ ...current, [key]: party }));
  }

  function updateExpense(
    index: number,
    field: "grantedOn" | "description" | "amount",
    value: string,
  ) {
    setData((current) => {
      const expenses = current.expenses.map((expense, itemIndex) =>
        itemIndex === index ? { ...expense, [field]: value } : expense,
      );
      const amounts = expenses.map((expense) =>
        parseFormattedAmount(expense.amount),
      );
      const totalAmount = amounts.every(
        (amount): amount is number => amount !== null,
      )
        ? formatCents(amounts.reduce((total, amount) => total + amount, 0))
        : current.totalAmount;
      return { ...current, expenses, totalAmount };
    });
  }

  function validationError() {
    if (publicationDateMissing) {
      return "Publiez d’abord la campagne pour calculer la période de la convention.";
    }
    if (!data.secondParty.address.trim()) {
      return "Renseignez l’adresse du siège de l’association bénéficiaire.";
    }
    if (
      data.secondParty.representatives.length === 0 ||
      data.secondParty.representatives.some(
        (representative) =>
          !representative.name.trim() || !representative.role.trim(),
      )
    ) {
      return "Complétez le nom et la fonction de chaque représentant bénéficiaire.";
    }
    return null;
  }

  async function downloadPdf() {
    const invalid = validationError();
    if (invalid) {
      setError(invalid);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/app/admin/subventions/${campaignId}/conventions/${assoId}/download`,
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
      link.download = `convention-${data.secondParty.associationName}.pdf`;
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
      {publicationDateMissing && (
        <div role="alert" className="alert alert-warning alert-soft">
          <span>
            Cette campagne n’est pas encore publiée. Sa date de publication est
            nécessaire pour calculer la période et la date des lignes.
          </span>
        </div>
      )}

      <div className="card card-border bg-base-100">
        <div className="card-body gap-5">
          <div>
            <h2 className="card-title">Informations bénéficiaire</h2>
            <p className="text-sm text-base-content/60">
              L’adresse reprend celle de CLA par défaut. Le président et le
              trésorier sont préremplis depuis les membres actifs lorsqu’ils
              sont trouvés.
            </p>
          </div>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              Adresse du siège de l’association bénéficiaire
            </legend>
            <textarea
              className="textarea min-h-24 w-full"
              value={data.secondParty.address}
              placeholder="Adresse complète"
              onChange={(event) =>
                updateParty("secondParty", {
                  ...data.secondParty,
                  address: event.target.value,
                })
              }
            />
          </fieldset>
          <BeneficiaryRepresentativeFields
            representatives={data.secondParty.representatives}
            onChange={(representatives) =>
              updateParty("secondParty", {
                ...data.secondParty,
                representatives,
              })
            }
          />
        </div>
      </div>

      <details className="collapse collapse-arrow border border-base-300 bg-base-100">
        <summary className="collapse-title font-medium">
          Afficher plus — modifier les informations préremplies
        </summary>
        <div className="collapse-content space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Période</legend>
              <input
                className="input w-full"
                value={data.period}
                onChange={(event) =>
                  setData((current) => ({
                    ...current,
                    period: event.target.value,
                  }))
                }
              />
            </fieldset>
            <fieldset className="fieldset md:col-span-2">
              <legend className="fieldset-legend">
                Nom de l’association bénéficiaire
              </legend>
              <input
                className="input w-full"
                value={data.secondParty.associationName}
                onChange={(event) =>
                  updateParty("secondParty", {
                    ...data.secondParty,
                    associationName: event.target.value,
                  })
                }
              />
            </fieldset>
          </div>

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
                    <th>Accordé le</th>
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
                          value={expense.grantedOn}
                          onChange={(event) =>
                            updateExpense(
                              index,
                              "grantedOn",
                              event.target.value,
                            )
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
                    <th>{data.totalAmount}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="divider">CLA</div>
          <div className="grid gap-4 md:grid-cols-2">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nom officiel</legend>
              <input
                className="input w-full"
                value={data.firstParty.associationName}
                onChange={(event) =>
                  updateParty("firstParty", {
                    ...data.firstParty,
                    associationName: event.target.value,
                  })
                }
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Adresse</legend>
              <textarea
                className="textarea min-h-24 w-full"
                value={data.firstParty.address}
                onChange={(event) =>
                  updateParty("firstParty", {
                    ...data.firstParty,
                    address: event.target.value,
                  })
                }
              />
            </fieldset>
          </div>
          <RepresentativesEditor
            title="Représentants de CLA"
            representatives={data.firstParty.representatives}
            onChange={(representatives) =>
              updateParty("firstParty", {
                ...data.firstParty,
                representatives,
              })
            }
          />
          <div>
            <h3 className="mb-2 font-semibold">Signature de CLA</h3>
            <SignatureFields
              signature={data.firstPartySignature}
              onChange={(firstPartySignature) =>
                setData((current) => ({ ...current, firstPartySignature }))
              }
            />
          </div>
        </div>
      </details>

      {error && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending}
          onClick={downloadPdf}
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
