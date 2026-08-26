"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  updateExpenseReportAction,
  type UpdateExpenseReportState,
} from "@/lib/expense-reports/expense-report-actions";

const initialState: UpdateExpenseReportState = { ok: false };

export function EditExpenseReportForm({
  assoSlug,
  reportId,
  title,
  description,
}: {
  assoSlug: string;
  reportId: string;
  title: string;
  description: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const { push: pushToast } = useToast();
  const [state, formAction, pending] = useActionState(
    updateExpenseReportAction,
    initialState,
  );

  // Se referme après un enregistrement réussi, ajusté pendant le rendu (cf.
  // règle react-hooks/set-state-in-effect) plutôt que dans un effet.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.ok && editing) {
      setEditing(false);
    }
  }

  useEffect(() => {
    if (!state.ok && state.error) {
      pushToast({ type: "error", message: state.error });
    }
  }, [state, pushToast]);

  return (
    <div className="card mt-8 border border-base-300 bg-base-100 shadow-md">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-base">
            Réglages de la Note de frais
          </h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? <X size={16} /> : <Pencil size={16} />}
            {editing ? "Annuler" : "Modifier"}
          </button>
        </div>

        {editing && (
          <form action={formAction} className="mt-2 flex flex-col gap-3">
            <input type="hidden" name="id" value={reportId} />
            <input type="hidden" name="assoSlug" value={assoSlug} />

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Titre</legend>
              <input
                type="text"
                name="title"
                className="input w-full"
                defaultValue={title}
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Description (facultative)
              </legend>
              <textarea
                name="description"
                className="textarea w-full"
                rows={3}
                defaultValue={description ?? ""}
              />
            </fieldset>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending}
            >
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
        )}
      </div>
    </div>
  );
}
