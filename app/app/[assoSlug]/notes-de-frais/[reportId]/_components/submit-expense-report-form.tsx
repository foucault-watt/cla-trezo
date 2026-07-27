"use client";

import { useActionState } from "react";
import {
  submitExpenseReportAction,
  type SubmitExpenseReportState,
} from "@/lib/expense-reports/expense-report-actions";

const initialState: SubmitExpenseReportState = { ok: false };

export function SubmitExpenseReportForm({
  assoSlug,
  reportId,
}: {
  assoSlug: string;
  reportId: string;
}) {
  const [state, formAction, pending] = useActionState(
    submitExpenseReportAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="id" value={reportId} />
      <input type="hidden" name="assoSlug" value={assoSlug} />

      {!state.ok && state.error && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.error}</span>
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          "Soumettre"
        )}
      </button>
    </form>
  );
}
