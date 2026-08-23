"use client";

import { useActionState, useRef } from "react";
import { Pencil } from "lucide-react";
import {
  Modal,
  useModalAutoClose,
  type ModalHandle,
} from "@/components/ui/modal";
import type { UpdateExpenseReportState } from "@/lib/expense-reports/expense-report-actions";

const initialState: UpdateExpenseReportState = { ok: false };

export function GeneralInformationModal({
  assoSlug,
  reportId,
  title,
  description,
  action,
}: {
  assoSlug?: string;
  reportId: string;
  title: string;
  description: string | null;
  action: (
    prevState: UpdateExpenseReportState,
    formData: FormData,
  ) => Promise<UpdateExpenseReportState>;
}) {
  const modalRef = useRef<ModalHandle>(null);
  const [state, formAction, pending] = useActionState(action, initialState);
  useModalAutoClose(modalRef, state.ok);
  return (
    <>
      <button
        type="button"
        className="btn btn-neutral btn-soft btn-sm"
        onClick={() => modalRef.current?.open()}
      >
        <Pencil size={15} />
        Modifier
      </button>
      <Modal ref={modalRef} title="Modifier les informations générales">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={reportId} />
          {assoSlug && <input type="hidden" name="assoSlug" value={assoSlug} />}
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Titre</legend>
            <input
              className="input w-full"
              name="title"
              defaultValue={title}
              required
            />
          </fieldset>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              Description (facultative)
            </legend>
            <textarea
              className="textarea w-full"
              name="description"
              rows={3}
              defaultValue={description ?? ""}
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
