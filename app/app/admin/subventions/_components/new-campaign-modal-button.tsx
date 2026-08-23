"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { Modal, type ModalHandle } from "@/components/ui/modal";
import { NewCampaignForm } from "./new-campaign-form";

export function NewCampaignModalButton() {
  const modalRef = useRef<ModalHandle>(null);

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => modalRef.current?.open()}
      >
        <Plus size={16} />
        Nouvelle campagne
      </button>
      <Modal ref={modalRef} title="Nouvelle campagne">
        <NewCampaignForm />
      </Modal>
    </>
  );
}
