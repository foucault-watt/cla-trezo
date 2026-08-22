"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
  type RefObject,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// Le portail ne peut cibler `document.body` qu'après hydratation côté
// client. `useSyncExternalStore` avec un getServerSnapshot distinct est le
// mécanisme React pour ce genre de "vrai côté client" sans passer par un
// setState synchrone dans un effet (cascading render évitable).
function subscribeNever() {
  return () => {};
}
function getClientSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

export interface ModalHandle {
  open: () => void;
  close: () => void;
}

/**
 * Ferme la modale dès que `shouldClose` devient vrai (typiquement
 * `state.ok` d'un `useActionState` après soumission réussie) — pattern
 * répété par toutes les modales à formulaire du site.
 */
export function useModalAutoClose(
  modalRef: RefObject<ModalHandle | null>,
  shouldClose: boolean,
) {
  useEffect(() => {
    if (shouldClose) modalRef.current?.close();
  }, [shouldClose, modalRef]);
}

/**
 * Fenêtre modale générique basée sur l'élément natif <dialog> (recommandé
 * par DaisyUI) : Échap et le clic sur le fond ferment la modale sans JS
 * supplémentaire. Un parent pilote l'ouverture via un ref (`modalRef.current?.open()`).
 *
 * Rendue via un portail dans `document.body` : le <dialog> contient ses
 * propres <form method="dialog"> pour fermer, donc s'il restait à sa place
 * logique dans l'arbre React, un appelant qui affiche la modale depuis
 * l'intérieur d'un <form> (ex : le picker de financement d'une Note de
 * frais) se retrouverait avec un <form> imbriqué dans un <form>, invalide en
 * HTML — cf. incident où FundingSourceField déclenchait cette erreur.
 */
export const Modal = forwardRef<
  ModalHandle,
  { title: string; children: ReactNode }
>(function Modal({ title, children }, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mounted = useSyncExternalStore(
    subscribeNever,
    getClientSnapshot,
    getServerSnapshot,
  );

  useImperativeHandle(ref, () => ({
    open: () => dialogRef.current?.showModal(),
    close: () => dialogRef.current?.close(),
  }));

  if (!mounted) return null;

  return createPortal(
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
    </dialog>,
    document.body,
  );
});
