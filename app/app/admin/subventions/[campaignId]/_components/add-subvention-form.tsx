"use client";

import { useActionState } from "react";
import {
  addSubventionAction,
  type AddSubventionState,
} from "@/lib/admin/subvention-actions";

const initialState: AddSubventionState = { ok: false };

export function AddSubventionForm({
  campaignId,
  assos,
}: {
  campaignId: string;
  assos: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    addSubventionAction,
    initialState,
  );

  return (
    <div className="card border border-base-300 bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title">Ajouter une Subvention</h2>

        <form action={formAction} className="mt-2 flex flex-col gap-3">
          <input type="hidden" name="campaignId" value={campaignId} />

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Asso</legend>
            <select name="assoId" className="select" defaultValue="" required>
              <option value="" disabled>
                Choisir une Asso
              </option>
              {assos.map((asso) => (
                <option key={asso.id} value={asso.id}>
                  {asso.name}
                </option>
              ))}
            </select>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Raison</legend>
            <input
              type="text"
              name="reason"
              className="input w-full"
              placeholder="Ex : Achat de matériel sportif"
              required
            />
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
            <legend className="fieldset-legend">Commentaire (facultatif)</legend>
            <textarea name="commentary" className="textarea w-full" rows={2} />
          </fieldset>

          {!state.ok && state.error && (
            <div role="alert" className="alert alert-error alert-soft">
              <span>{state.error}</span>
            </div>
          )}
          {state.ok && (
            <div role="alert" className="alert alert-success alert-soft">
              <span>Subvention ajoutée.</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Ajouter"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
