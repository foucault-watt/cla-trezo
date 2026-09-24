"use client";

import { useActionState, useRef } from "react";
import { Ban, X } from "lucide-react";
import {
  Modal,
  useModalAutoClose,
  type ModalHandle,
} from "@/components/ui/modal";
import {
  rejectExpenseReportAction,
  type RejectExpenseReportState,
} from "@/lib/admin/expense-report-actions";
import { REJECTION_REASON_MAX_LENGTH } from "@/lib/admin/expense-report-input";

const initialState: RejectExpenseReportState = { ok: false };

/**
 * Rejette une Note Prise en charge (issue #20, hors périmètre initial) :
 * transition terminale, non modifiable ensuite (cf.
 * rejectExpenseReportAction) — d'où la modale de confirmation, même si
 * moins radicale qu'une suppression (la Note et son historique restent
 * consultables, seul son statut change).
 */
export function RejectButton({ reportId }: { reportId: string }) {
  const modalRef = useRef<ModalHandle>(null);
  const [state, formAction, pending] = useActionState(
    rejectExpenseReportAction,
    initialState,
  );
  useModalAutoClose(modalRef, state.ok);

  return (
    <>
      <button
        type="button"
        className="btn btn-error btn-soft"
        onClick={() => modalRef.current?.open()}
      >
        <Ban size={18} />
        Rejeter la Note de frais
      </button>
      <Modal ref={modalRef} title="Rejeter cette Note de frais ?">
        <p className="text-sm text-base-content/80">
          Le rejet est définitif : la Note ne pourra plus être modifiée ni
          revenir en Brouillon. Préférez le rejet à la suppression si vous
          voulez garder une trace du refus.
        </p>
        <form action={formAction}>
          <input type="hidden" name="id" value={reportId} />
          <fieldset className="fieldset mt-4">
            <legend className="fieldset-legend">Motif du rejet</legend>
            <textarea
              name="reason"
              className="textarea w-full"
              rows={4}
              required
              maxLength={REJECTION_REASON_MAX_LENGTH}
              placeholder="Ex. : le justificatif du 12/09 est illisible, merci de refaire une Note avec une facture lisible."
            />
            <p className="label whitespace-normal">
              Ce motif sera visible par l&apos;Asso sur sa Note de frais.
            </p>
          </fieldset>
          {!state.ok && state.error && (
            <div role="alert" className="alert alert-error alert-soft mt-4">
              <span>{state.error}</span>
            </div>
          )}
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={() => modalRef.current?.close()}
              disabled={pending}
            >
              <X size={16} />
              Annuler
            </button>
            <button type="submit" className="btn btn-error" disabled={pending}>
              {pending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Ban size={16} />
              )}
              {pending ? "Rejet…" : "Confirmer le rejet"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
