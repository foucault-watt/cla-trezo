"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { Modal, type ModalHandle } from "@/components/ui/modal";
import {
  deleteExpenseReportAction,
  type DeleteExpenseReportState,
} from "@/lib/expense-reports/expense-report-actions";

const initialState: DeleteExpenseReportState = { ok: false };

export function DeleteExpenseReportButton({
  assoSlug,
  reportId,
  title,
}: {
  assoSlug: string;
  reportId: string;
  title: string;
}) {
  const router = useRouter();
  const modalRef = useRef<ModalHandle>(null);
  const [state, formAction, pending] = useActionState(
    deleteExpenseReportAction,
    initialState,
  );
  useEffect(() => {
    if (state.ok) router.push(`/app/${assoSlug}/notes-de-frais`);
  }, [state.ok, assoSlug, router]);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost text-error"
        onClick={() => modalRef.current?.open()}
      >
        <Trash2 size={16} />
        Supprimer
      </button>
      <Modal ref={modalRef} title="Supprimer cette Note de frais ?">
        <p className="text-sm text-base-content/80">
          « <span className="font-medium">{title}</span> » sera définitivement
          supprimée, avec toutes ses Dépenses et ses Justificatifs. Cette action
          est irréversible.
        </p>
        {!state.ok && state.error && (
          <div role="alert" className="alert alert-error alert-soft mt-4">
            {state.error}
          </div>
        )}
        <form action={formAction} className="modal-action">
          <input type="hidden" name="id" value={reportId} />
          <input type="hidden" name="assoSlug" value={assoSlug} />
          <button
            type="button"
            className="btn"
            onClick={() => modalRef.current?.close()}
          >
            <X size={16} />
            Annuler
          </button>
          <button type="submit" className="btn btn-error" disabled={pending}>
            {pending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <Trash2 size={16} />
                Supprimer définitivement
              </>
            )}
          </button>
        </form>
      </Modal>
    </>
  );
}
