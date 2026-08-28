"use client";

import { useRef, useState } from "react";
import { Download, TriangleAlert, X } from "lucide-react";
import type { ArchiveCheckResult } from "@/lib/admin/storage";
import { Modal, type ModalHandle } from "@/components/ui/modal";

type CheckState =
  | { status: "loading" }
  | ({ status: "ready" } & ArchiveCheckResult)
  | { status: "error" };

/**
 * Avant de lancer le zip d'une Structure, on vérifie combien des fichiers
 * attendus sont réellement présents sur le disque (cf. archive/check) : un
 * fichier référencé en base mais perdu ne doit ni casser tout le
 * téléchargement, ni passer inaperçu — d'où la modale de confirmation dans
 * tous les cas plutôt qu'un lien direct.
 */
export function StorageArchiveButton({
  assoSlug,
  assoName,
}: {
  assoSlug: string;
  assoName: string;
}) {
  const modalRef = useRef<ModalHandle>(null);
  const [check, setCheck] = useState<CheckState>({ status: "loading" });

  async function openAndCheck() {
    modalRef.current?.open();
    setCheck({ status: "loading" });
    try {
      const response = await fetch(
        `/app/admin/stockage/${assoSlug}/archive/check`,
      );
      if (!response.ok) throw new Error("check failed");
      const data = (await response.json()) as ArchiveCheckResult;
      setCheck({ status: "ready", ...data });
    } catch {
      setCheck({ status: "error" });
    }
  }

  function download() {
    window.location.href = `/app/admin/stockage/${assoSlug}/archive`;
    modalRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline shrink-0"
        onClick={openAndCheck}
      >
        <Download size={16} />
        Télécharger (.zip)
      </button>
      <Modal ref={modalRef} title={`Archive — ${assoName}`}>
        {check.status === "loading" && (
          <p className="flex items-center gap-2 text-sm text-base-content/70">
            <span className="loading loading-spinner loading-sm" />
            Vérification des fichiers sur le serveur…
          </p>
        )}

        {check.status === "error" && (
          <p className="text-sm text-error">
            Impossible de vérifier les fichiers pour l&apos;instant. Réessayez
            dans un instant.
          </p>
        )}

        {check.status === "ready" &&
          (check.missingCount > 0 ? (
            <div role="alert" className="alert alert-warning text-sm">
              <TriangleAlert size={18} className="shrink-0" />
              <span>
                {check.missingCount} fichier(s) sur {check.totalCount} sont
                introuvables sur le serveur et seront absents de
                l&apos;archive. Les {check.availableCount} autres seront
                téléchargés normalement.
              </span>
            </div>
          ) : (
            <p className="text-sm text-base-content/80">
              {check.totalCount} fichier(s) prêt(s) à être téléchargés.
            </p>
          ))}

        <div className="modal-action">
          <button
            type="button"
            className="btn"
            onClick={() => modalRef.current?.close()}
          >
            <X size={16} />
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={check.status !== "ready"}
            onClick={download}
          >
            <Download size={16} />
            Télécharger
          </button>
        </div>
      </Modal>
    </>
  );
}
