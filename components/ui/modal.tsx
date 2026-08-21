"use client";

import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";

export interface ModalHandle {
  open: () => void;
  close: () => void;
}

/**
 * Fenêtre modale générique basée sur l'élément natif <dialog> (recommandé
 * par DaisyUI) : Échap et le clic sur le fond ferment la modale sans JS
 * supplémentaire. Un parent pilote l'ouverture via un ref (`modalRef.current?.open()`).
 */
export const Modal = forwardRef<
  ModalHandle,
  { title: string; children: ReactNode }
>(function Modal({ title, children }, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useImperativeHandle(ref, () => ({
    open: () => dialogRef.current?.showModal(),
    close: () => dialogRef.current?.close(),
  }));

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <form method="dialog">
          <button
            type="submit"
            className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
            aria-label="Fermer"
          >
            ✕
          </button>
        </form>
        <h3 className="text-lg font-bold">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button aria-label="Fermer">close</button>
      </form>
    </dialog>
  );
});
