"use client";

import { useActionState, useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";
import { Modal, type ModalHandle } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
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
  const modalRef = useRef<ModalHandle>(null);
  const { push: pushToast } = useToast();
  const [state, formAction, pending] = useActionState(
    deleteExpenseReportAction,
    initialState,
  );

  useEffect(() => {
    if (!state.ok && state.error) {
      pushToast({ type: "error", message: state.error });
    }
  }, [state, pushToast]);

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
