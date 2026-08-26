"use client";

import { useActionState, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast";
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
  const { push: pushToast } = useToast();
  const [state, formAction, pending] = useActionState(
    addManualMovementAction,
    initialState,
  );
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  useEffect(() => {
    if (state.ok) {
      pushToast({ type: "success", message: "Mouvement enregistré." });
    } else if (state.error) {
      pushToast({ type: "error", message: state.error });
    }
  }, [state, pushToast]);

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
            <DatePicker name="date" value={date} onChange={setDate} />
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

          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <Save size={16} />
                Enregistrer
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
