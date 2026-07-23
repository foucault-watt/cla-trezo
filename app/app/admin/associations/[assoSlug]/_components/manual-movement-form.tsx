"use client";

import { useActionState } from "react";
import {
  addManualMovementAction,
  type AddManualMovementState,
} from "@/lib/admin/movements";

const initialState: AddManualMovementState = { ok: false };

export function ManualMovementForm({
  assoId,
  assoSlug,
}: {
  assoId: string;
  assoSlug: string;
}) {
  const [state, formAction, pending] = useActionState(
    addManualMovementAction,
    initialState,
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="card border border-base-300 bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title">Entrée / sortie manuelle</h2>
        <p className="text-sm text-base-content/70">
          Première entrée = initialisation du Solde pour ce Club.
        </p>

        <form action={formAction} className="mt-2 flex flex-col gap-3">
          <input type="hidden" name="assoId" value={assoId} />
          <input type="hidden" name="assoSlug" value={assoSlug} />

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Type de mouvement</legend>
            <select
              name="movementType"
              className="select"
              defaultValue="CREDIT"
              required
            >
              <option value="CREDIT">Entrée (+)</option>
              <option value="DEBIT">Sortie (-)</option>
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Montant (€)</legend>
            <input
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              className="input w-full"
              placeholder="0.00"
              required
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Date du mouvement</legend>
            <input
              type="date"
              name="date"
              className="input w-full"
              defaultValue={today}
              required
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Description</legend>
            <input
              type="text"
              name="description"
              className="input w-full"
              placeholder="Ex : Solde initial de l'année"
              required
            />
          </fieldset>

          {!state.ok && state.error && (
            <div role="alert" className="alert alert-error alert-soft">
              <span>{state.error}</span>
            </div>
          )}
          {state.ok && (
            <div role="alert" className="alert alert-success alert-soft">
              <span>Mouvement enregistré.</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Enregistrer"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
