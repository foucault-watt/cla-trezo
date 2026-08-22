"use client";

import { useActionState, useRef } from "react";
import { Pencil } from "lucide-react";
import {
  Modal,
  useModalAutoClose,
  type ModalHandle,
} from "@/components/ui/modal";
import {
  updateExpenseReportBeneficiaryAsAdminAction,
  type UpdateExpenseReportBeneficiaryAsAdminState,
} from "@/lib/admin/expense-report-actions";

const initialState: UpdateExpenseReportBeneficiaryAsAdminState = { ok: false };

export function AdminBeneficiaryModal({
  reportId,
  firstname,
  lastname,
  iban,
}: {
  reportId: string;
  firstname: string;
  lastname: string;
  iban: string;
}) {
  const modalRef = useRef<ModalHandle>(null);
  const [state, formAction, pending] = useActionState(
    updateExpenseReportBeneficiaryAsAdminAction,
    initialState,
  );
  useModalAutoClose(modalRef, state.ok);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => modalRef.current?.open()}
      >
        <Pencil size={15} /> Modifier
      </button>
      <Modal ref={modalRef} title="Modifier le bénéficiaire">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={reportId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Prénom</legend>
              <input
                className="input w-full"
                name="beneficiaryFirstname"
                defaultValue={firstname}
                required
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nom</legend>
              <input
                className="input w-full"
                name="beneficiaryLastname"
                defaultValue={lastname}
                required
              />
            </fieldset>
          </div>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">IBAN</legend>
            <input
              className="input w-full font-mono"
              name="beneficiaryIban"
              defaultValue={iban}
              required
              autoComplete="off"
            />
          </fieldset>
          {!state.ok && state.error && (
            <div className="alert alert-error alert-soft">{state.error}</div>
          )}
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={() => modalRef.current?.close()}
            >
              Annuler
            </button>
            <button className="btn btn-primary" disabled={pending}>
              {pending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
