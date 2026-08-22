"use client";

import { useActionState, useRef } from "react";
import { CheckCircle2, Send, TriangleAlert } from "lucide-react";
import {
  Modal,
  useModalAutoClose,
  type ModalHandle,
} from "@/components/ui/modal";
import {
  submitExpenseReportAction,
  type SubmitExpenseReportState,
} from "@/lib/expense-reports/expense-report-actions";
import { formatCents } from "@/lib/money";

const initialState: SubmitExpenseReportState = { ok: false };

export function SubmitExpenseReportForm({
  assoSlug,
  reportId,
  beneficiaryName,
  reimbursementsCount,
  totalAmountCents,
  documentsCount,
  warnings,
}: {
  assoSlug: string;
  reportId: string;
  beneficiaryName: string;
  reimbursementsCount: number;
  totalAmountCents: number;
  documentsCount: number;
  warnings: string[];
}) {
  const modalRef = useRef<ModalHandle>(null);
  const [state, formAction, pending] = useActionState(
    submitExpenseReportAction,
    initialState,
  );
  useModalAutoClose(modalRef, state.ok);
  return (
    <>
      {state.ok && (
        <div role="status" className="alert alert-success alert-soft mb-4">
          <CheckCircle2 size={18} />
          La Note de frais a bien été soumise à l&apos;Admin CLA.
        </div>
      )}
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => modalRef.current?.open()}
      >
        <Send size={17} />
        Soumettre la Note de frais
      </button>
      <Modal ref={modalRef} title="Soumettre cette Note de frais ?">
        <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
          <dt className="text-base-content/70">Bénéficiaire</dt>
          <dd className="font-medium">{beneficiaryName}</dd>
          <dt className="text-base-content/70">Dépenses</dt>
          <dd className="font-medium">{reimbursementsCount}</dd>
          <dt className="text-base-content/70">Montant total</dt>
          <dd className="font-medium">{formatCents(totalAmountCents)}</dd>
          <dt className="text-base-content/70">Justificatifs</dt>
          <dd className="font-medium">{documentsCount}</dd>
        </dl>
        {warnings.length > 0 && (
          <div className="alert alert-warning alert-soft mt-4">
            <TriangleAlert size={18} className="shrink-0" />
            <div>
              <p className="font-medium">
                {warnings.length} alerte(s) non bloquante(s)
              </p>
              <ul className="mt-1 list-disc pl-4 text-sm">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <p className="mt-4 text-sm text-base-content/70">
          La note restera modifiable jusqu&apos;à sa prise en charge par
          l&apos;Admin CLA.
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
            Annuler
          </button>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Soumettre la note"
            )}
          </button>
        </form>
      </Modal>
    </>
  );
}
