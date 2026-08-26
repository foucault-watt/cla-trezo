"use client";

import { useActionState, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import {
  saveConventionPdfSettingsAction,
  type ConventionPdfSettingsState,
} from "@/lib/admin/convention-pdf-settings-actions";
import type { ConventionPdfSettingsInput } from "@/lib/admin/convention-pdf-settings-input";

const initialState: ConventionPdfSettingsState = { ok: false };

export function ConventionSettingsForm({
  initialSettings,
}: {
  initialSettings: ConventionPdfSettingsInput;
}) {
  const [representatives, setRepresentatives] = useState(
    initialSettings.claRepresentatives,
  );
  const [state, formAction, pending] = useActionState(
    saveConventionPdfSettingsAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="claRepresentatives"
        value={JSON.stringify(representatives)}
      />

      <div className="card card-border bg-base-100">
        <div className="card-body gap-4">
          <div>
            <h2 className="card-title">Identité de CLA</h2>
            <p className="text-sm text-base-content/60">
              Ces valeurs apparaissent comme première partie dans toutes les
              conventions.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nom officiel</legend>
              <input
                className="input w-full"
                name="claAssociationName"
                defaultValue={initialSettings.claAssociationName}
                required
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Adresse du siège</legend>
              <textarea
                className="textarea min-h-24 w-full"
                name="claAddress"
                defaultValue={initialSettings.claAddress}
                required
              />
            </fieldset>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Représentants</h3>
              <p className="text-sm text-base-content/60">
                Ils sont cités dans l’introduction de la convention.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() =>
                setRepresentatives((current) => [
                  ...current,
                  { name: "", role: "" },
                ])
              }
            >
              <Plus size={16} />
              Ajouter un représentant
            </button>
          </div>

          <div className="space-y-3">
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
                    required
                    onChange={(event) =>
                      setRepresentatives((current) =>
                        current.map((item, itemIndex) =>
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
                    required
                    onChange={(event) =>
                      setRepresentatives((current) =>
                        current.map((item, itemIndex) =>
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
                    setRepresentatives((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card card-border bg-base-100">
        <div className="card-body gap-4">
          <div>
            <h2 className="card-title">Signature de CLA</h2>
            <p className="text-sm text-base-content/60">
              La date sera automatiquement celle du téléchargement.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nom du signataire</legend>
              <input
                className="input w-full"
                name="claSignatoryName"
                defaultValue={initialSettings.claSignatoryName}
                required
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Fonction</legend>
              <input
                className="input w-full"
                name="claSignatoryRole"
                defaultValue={initialSettings.claSignatoryRole}
                required
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Ville de signature</legend>
              <input
                className="input w-full"
                name="claSignatureCity"
                defaultValue={initialSettings.claSignatureCity}
                required
              />
            </fieldset>
          </div>
        </div>
      </div>

      <div className="card card-border bg-base-100">
        <div className="card-body gap-4">
          <div>
            <h2 className="card-title">Notes de frais</h2>
            <p className="text-sm text-base-content/60">
              Nom proposé par défaut pour la signature « Le Trésorier de CLA
              » sur les PDF finaux d’une Note de frais validée.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Trésorier de CLA</legend>
              <input
                className="input w-full"
                name="claTreasurerName"
                defaultValue={initialSettings.claTreasurerName}
                required
              />
            </fieldset>
          </div>
        </div>
      </div>

      {!state.ok && state.error && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.error}</span>
        </div>
      )}
      {state.ok && (
        <div role="status" className="alert alert-success alert-soft">
          <span>Les paramètres PDF ont été enregistrés.</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending || representatives.length === 0}
        >
          {pending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <Save size={18} />
          )}
          {pending ? "Enregistrement…" : "Enregistrer les paramètres"}
        </button>
      </div>
    </form>
  );
}
