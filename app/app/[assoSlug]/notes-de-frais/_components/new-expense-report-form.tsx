"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createExpenseReportAction,
  type CreateExpenseReportState,
} from "@/lib/expense-reports/expense-report-actions";

const initialState: CreateExpenseReportState = { ok: false };

export function NewExpenseReportForm({ assoSlug }: { assoSlug: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createExpenseReportAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok && state.reportId) {
      router.push(`/app/${assoSlug}/notes-de-frais/${state.reportId}`);
    }
  }, [state, router, assoSlug]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="assoSlug" value={assoSlug} />

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Nom de la Note de frais</legend>
        <input
          type="text"
          name="title"
          className="input w-full"
          placeholder="Ex : Déplacement gala 2026"
          required
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Description (facultative)</legend>
        <textarea name="description" className="textarea w-full" rows={3} />
      </fieldset>

      {!state.ok && state.error && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.error}</span>
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          "Créer la Note de frais"
        )}
      </button>
    </form>
  );
}
