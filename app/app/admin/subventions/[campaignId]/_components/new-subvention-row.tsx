"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import {
  addSubventionAction,
  type AddSubventionState,
} from "@/lib/admin/subvention-actions";
import { useToast } from "@/components/ui/toast";
import { AssoSelect } from "./asso-select";

const initialState: AddSubventionState = { ok: false };

export function NewSubventionRow({
  campaignId,
  assos,
  onSaved,
  onCancel,
}: {
  campaignId: string;
  assos: { id: string; name: string }[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { push: pushToast } = useToast();
  const [assoId, setAssoId] = useState("");
  const [state, formAction, pending] = useActionState(
    addSubventionAction,
    initialState,
  );

  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.ok) {
      onSaved();
    }
  }

  useEffect(() => {
    if (state.ok) {
      pushToast({ type: "success", message: "Subvention ajoutée." });
    }
  }, [state, pushToast]);

  return (
    <tr>
      <td colSpan={4}>
        <form
          action={formAction}
          className="flex flex-col gap-2 py-2 sm:flex-row sm:items-end"
        >
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="assoId" value={assoId} />

          <fieldset className="fieldset w-full sm:w-48">
            <legend className="fieldset-legend">Asso</legend>
            <AssoSelect
              assos={assos}
              value={assoId}
              onChange={(id) => setAssoId(id)}
            />
          </fieldset>

          <fieldset className="fieldset flex-1">
            <legend className="fieldset-legend">Raison</legend>
            <input
              type="text"
              name="reason"
              className="input input-sm w-full"
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
              className="input input-sm w-32"
              placeholder="0.00"
              required
            />
          </fieldset>

          <fieldset className="fieldset flex-1">
            <legend className="fieldset-legend">Commentaire</legend>
            <input
              type="text"
              name="commentary"
              className="input input-sm w-full"
            />
          </fieldset>

          {!state.ok && state.error && (
            <div
              role="alert"
              className="alert alert-error alert-soft alert-sm"
            >
              <span>{state.error}</span>
            </div>
          )}

          <div className="flex gap-1">
            <button
              type="submit"
              className="btn btn-ghost btn-square btn-sm text-success"
              aria-label="Enregistrer la Subvention"
              disabled={pending || !assoId}
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
