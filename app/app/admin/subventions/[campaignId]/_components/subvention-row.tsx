"use client";

import { useActionState, useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import {
  updateSubventionAction,
  deleteSubventionAction,
  type UpdateSubventionState,
  type DeleteSubventionState,
} from "@/lib/admin/subvention-actions";
import { formatCents } from "@/lib/money";

const initialUpdateState: UpdateSubventionState = { ok: false };
const initialDeleteState: DeleteSubventionState = { ok: false };

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
    initialUpdateState,
  );
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteSubventionAction,
    initialDeleteState,
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
          <div className="flex gap-1">
            <button
              type="button"
              className="btn btn-ghost btn-square btn-xs"
              aria-label="Modifier la Subvention"
              onClick={() => setEditing((value) => !value)}
            >
              {editing ? <X size={15} /> : <Pencil size={15} />}
            </button>
            <form action={deleteFormAction}>
              <input type="hidden" name="id" value={subvention.id} />
              <input type="hidden" name="campaignId" value={campaignId} />
              <button
                type="submit"
                className="btn btn-ghost btn-square btn-xs text-error"
                aria-label="Supprimer la Subvention"
                disabled={deletePending}
                onClick={(event) => {
                  if (
                    !confirm(
                      `Supprimer la Subvention de ${subvention.assoName} (${formatCents(subvention.amountCents)}) ?`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                {deletePending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <Trash2 size={15} />
                )}
              </button>
            </form>
          </div>
        </td>
      </tr>
      {!deleteState.ok && deleteState.error && (
        <tr>
          <td colSpan={4}>
            <div role="alert" className="alert alert-error alert-soft alert-sm">
              <span>{deleteState.error}</span>
            </div>
          </td>
        </tr>
      )}
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

              <div className="flex gap-1">
                <button
                  type="submit"
                  className="btn btn-ghost btn-square btn-sm text-success"
                  aria-label="Enregistrer les modifications"
                  disabled={pending}
                >
                  {pending ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <Check size={17} />
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-square btn-sm"
                  aria-label="Annuler la modification"
                  onClick={() => setEditing(false)}
                >
                  <X size={17} />
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
