"use client";

import { useActionState } from "react";
import {
  takeOverExpenseReportAction,
  type TakeOverExpenseReportState,
} from "@/lib/admin/expense-report-actions";

const initialState: TakeOverExpenseReportState = { ok: false };

export function TakeOverButton({ reportId }: { reportId: string }) {
  const [state, formAction, pending] = useActionState(
    takeOverExpenseReportAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="id" value={reportId} />

      {!state.ok && state.error && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.error}</span>
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          "Prendre en charge"
        )}
      </button>
    </form>
  );
}
