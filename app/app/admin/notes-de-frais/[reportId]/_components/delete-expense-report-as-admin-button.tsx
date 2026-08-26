"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Trash2, X } from "lucide-react";
import { Modal, type ModalHandle } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  deleteExpenseReportAsAdminAction,
  type DeleteExpenseReportAsAdminState,
} from "@/lib/admin/expense-report-actions";
import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";

const initialState: DeleteExpenseReportAsAdminState = { ok: false };

/**
 * Suppression Admin d'une Note de frais, quel que soit son statut (issue
 * #20, hors périmètre initial) : contrairement à DeleteExpenseReportButton
 * (Structure, Brouillon uniquement), cette action fonctionne aussi sur une
 * Note Prise en charge, Rejetée ou même Validée — la modale insiste donc
 * fortement sur la préférence pour le Rejet et exige une case cochée avant
 * d'activer la confirmation, plutôt qu'un simple clic.
 */
export function DeleteExpenseReportAsAdminButton({
  reportId,
  status,
}: {
  reportId: string;
  status: ExpenseReportStatus;
}) {
  const modalRef = useRef<ModalHandle>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const { push: pushToast } = useToast();
  const [state, formAction, pending] = useActionState(
    deleteExpenseReportAsAdminAction,
    initialState,
  );

  useEffect(() => {
    if (!state.ok && state.error) {
      pushToast({ type: "error", message: state.error });
    }
  }, [state, pushToast]);

  const canRejectInstead = status === "SUBMITTED" || status === "TAKEN_OVER";

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm text-error"
        onClick={() => {
          setAcknowledged(false);
          modalRef.current?.open();
        }}
      >
        <Trash2 size={16} />
        Supprimer
      </button>
      <Modal ref={modalRef} title="Supprimer définitivement cette Note de frais ?">
        <div role="alert" className="alert alert-error alert-soft">
          <span>
            <strong>Ce n&apos;est vraiment pas conseillé.</strong>{" "}
            {canRejectInstead
              ? "Rejetez plutôt cette Note : le refus reste tracé, alors qu'une suppression l'efface définitivement, elle et son historique."
              : status === "FINALIZED"
                ? "Cette Note est Validée : des mouvements financiers réels lui sont rattachés. La supprimer les effacera aussi, ce qui changera silencieusement le Solde et les Subventions concernées, comme si elle n'avait jamais existé."
                : "Cette Note et tout son contenu (Lignes, Justificatifs) seront perdus sans laisser de trace."}
          </span>
        </div>
        <p className="mt-3 text-sm text-base-content/80">
          Cette action est irréversible et ne peut pas être annulée.
        </p>
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="checkbox checkbox-error mt-0.5"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
          Je comprends les conséquences et je veux supprimer cette Note de
          frais quand même.
        </label>
        <form action={formAction} className="modal-action">
          <input type="hidden" name="id" value={reportId} />
          <button
            type="button"
            className="btn"
            onClick={() => modalRef.current?.close()}
            disabled={pending}
          >
            <X size={16} />
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-error"
            disabled={pending || !acknowledged}
          >
            {pending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Trash2 size={16} />
            )}
            {pending ? "Suppression…" : "Supprimer définitivement"}
          </button>
        </form>
      </Modal>
    </>
  );
}
