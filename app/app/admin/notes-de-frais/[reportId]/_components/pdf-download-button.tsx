"use client";

import { useActionState, useEffect, useRef } from "react";
import { Download, RotateCcw, X } from "lucide-react";
import {
  Modal,
  useModalAutoClose,
  type ModalHandle,
} from "@/components/ui/modal";
import {
  regenerateExpenseReportPdfAction,
  type RegeneratePdfState,
} from "@/lib/admin/regenerate-expense-report-pdf";

const initialState: RegeneratePdfState = { ok: false };

const GONE = 410;

/**
 * Lien de téléchargement d'un PDF final qui vérifie d'abord que le fichier
 * existe encore sur le disque (route renvoie 410 sinon, cf.
 * pdfs/[pdfId]/route.ts) : dans le cas nominal, téléchargement direct sans
 * friction ; si le fichier a été perdu, une modale explique et propose de le
 * reconstituer (cf. regenerate-expense-report-pdf.ts) avant de relancer le
 * téléchargement.
 */
export function PdfDownloadButton({
  reportId,
  pdfId,
  label,
}: {
  reportId: string;
  pdfId: string;
  label: string;
}) {
  const modalRef = useRef<ModalHandle>(null);
  const url = `/app/admin/notes-de-frais/${reportId}/pdfs/${pdfId}`;
  const [state, formAction, pending] = useActionState(
    regenerateExpenseReportPdfAction,
    initialState,
  );
  useModalAutoClose(modalRef, state.ok);

  useEffect(() => {
    if (state.ok) {
      window.location.href = url;
    }
  }, [state, url]);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const response = await fetch(url);
    if (response.status === GONE) {
      modalRef.current?.open();
      return;
    }
    window.location.href = url;
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        onClick={handleClick}
      >
        <Download size={16} />
        {label}
      </button>
      <Modal ref={modalRef} title="Fichier introuvable">
        <p className="text-sm text-base-content/80">
          Ce PDF n&apos;est plus disponible sur le serveur, probablement
          suite à un incident de stockage. Vous pouvez le reconstituer à
          partir des données conservées en base : le contenu financier sera
          identique, mais le document portera une mention indiquant qu&apos;il
          s&apos;agit d&apos;une reconstitution.
        </p>
        <form action={formAction}>
          <input type="hidden" name="pdfId" value={pdfId} />
          {!state.ok && state.error && (
            <div
              role="alert"
              className="alert alert-error alert-soft mt-3 text-sm"
            >
              <span>{state.error}</span>
            </div>
          )}
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={() => modalRef.current?.close()}
            >
              <X size={16} />
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <RotateCcw size={16} />
              )}
              Reconstituer et télécharger
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
