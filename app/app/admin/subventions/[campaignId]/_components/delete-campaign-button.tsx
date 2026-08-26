"use client";

import { useActionState, useEffect, useRef } from "react";
import { Trash2, X } from "lucide-react";
import { Modal, type ModalHandle } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  deleteSubventionCampaignAction,
  type DeleteSubventionCampaignState,
} from "@/lib/admin/subvention-campaign-actions";

const initialState: DeleteSubventionCampaignState = { ok: false };

export function DeleteCampaignButton({
  campaignId,
  name,
}: {
  campaignId: string;
  name: string;
}) {
  const modalRef = useRef<ModalHandle>(null);
  const { push: pushToast } = useToast();
  const [state, formAction, pending] = useActionState(
    deleteSubventionCampaignAction,
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
        className="btn btn-ghost btn-sm text-error"
        onClick={() => modalRef.current?.open()}
      >
        <Trash2 size={16} />
        Supprimer
      </button>
      <Modal ref={modalRef} title="Supprimer cette Campagne ?">
        <p className="text-sm text-base-content/80">
          « <span className="font-medium">{name}</span> » sera définitivement
          supprimée, avec toutes ses Subventions. Cette action est
          irréversible et est refusée si l&apos;une de ses Subventions est
          déjà utilisée par une Note de frais ou un Mouvement financier.
        </p>
        <form action={formAction} className="modal-action">
          <input type="hidden" name="id" value={campaignId} />
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
