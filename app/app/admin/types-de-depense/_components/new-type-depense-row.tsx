"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { createTypeDepenseAction } from "@/lib/admin/type-depense-actions";
import { useTypeDepenseAction } from "./use-type-depense-action";

export function NewTypeDepenseRow({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [state, formAction, pending] = useTypeDepenseAction(
    createTypeDepenseAction,
  );

  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.ok) {
      onSaved();
    }
  }

  return (
    <tr>
      <td colSpan={3}>
        <form
          action={formAction}
          className="flex flex-col gap-2 py-2 sm:flex-row sm:items-end"
        >
          <fieldset className="fieldset flex-1">
            <legend className="fieldset-legend">Libellé</legend>
            <input
              type="text"
              name="label"
              className="input input-sm w-full"
              placeholder="Ex : Frais de port"
              maxLength={100}
              autoFocus
              required
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
              aria-label="Enregistrer le Type de dépense"
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
              aria-label="Annuler l'ajout"
              onClick={onCancel}
            >
              <X size={17} />
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
