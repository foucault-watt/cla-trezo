"use client";

import { useActionState, useState } from "react";
import {
  updateSubventionAction,
  type UpdateSubventionState,
} from "@/lib/admin/subvention-actions";
import { formatCents } from "@/lib/money";

const initialState: UpdateSubventionState = { ok: false };

export function SubventionRow({
  campaignId,
  subvention,
}: {
  campaignId: string;
  subvention: {
    id: string;
    assoName: string;
    reason: string;
    amountCents: number;
    commentary: string | null;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateSubventionAction,
    initialState,
  );

  // Ferme le panneau d'édition dès que la mise à jour réussit, sans passer
  // par un effet (cf. règle react-hooks/set-state-in-effect) : on ajuste
  // l'état pendant le rendu en comparant avec le state précédent.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.ok && editing) {
      setEditing(false);
    }
  }

  return (
    <>
      <tr className="hover">
        <td>{subvention.assoName}</td>
        <td>
          {subvention.reason}
          {subvention.commentary && (
            <p className="text-xs text-base-content/60">
              {subvention.commentary}
            </p>
          )}
        </td>
        <td>{formatCents(subvention.amountCents)}</td>
        <td>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Annuler" : "Modifier"}
          </button>
        </td>
      </tr>
      {editing && (
        <tr>
          <td colSpan={4}>
            <form
              action={formAction}
              className="flex flex-col gap-2 py-2 sm:flex-row sm:items-end"
            >
              <input type="hidden" name="id" value={subvention.id} />
              <input type="hidden" name="campaignId" value={campaignId} />

              <fieldset className="fieldset flex-1">
                <legend className="fieldset-legend">Raison</legend>
                <input
                  type="text"
                  name="reason"
                  defaultValue={subvention.reason}
                  className="input input-sm w-full"
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
                  defaultValue={(subvention.amountCents / 100).toFixed(2)}
                  className="input input-sm w-32"
                  required
                />
              </fieldset>

              <fieldset className="fieldset flex-1">
                <legend className="fieldset-legend">Commentaire</legend>
                <input
                  type="text"
                  name="commentary"
                  defaultValue={subvention.commentary ?? ""}
                  className="input input-sm w-full"
                />
              </fieldset>

              {!state.ok && state.error && (
                <div role="alert" className="alert alert-error alert-soft alert-sm">
                  <span>{state.error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={pending}
              >
                {pending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Enregistrer"
                )}
              </button>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
