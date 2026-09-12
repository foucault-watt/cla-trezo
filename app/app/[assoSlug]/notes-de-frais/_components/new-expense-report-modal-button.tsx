"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { Modal, type ModalHandle } from "@/components/ui/modal";
import { NewExpenseReportForm } from "./new-expense-report-form";

export function NewExpenseReportModalButton({
  assoSlug,
}: {
  assoSlug: string;
}) {
  const modalRef = useRef<ModalHandle>(null);

  return (
    <>
      <button
        type="button"
        className="btn btn-primary w-full sm:w-auto"
        onClick={() => modalRef.current?.open()}
      >
        <Plus size={16} />
        Nouvelle Note de frais
      </button>
      <Modal ref={modalRef} title="Nouvelle Note de frais">
        <NewExpenseReportForm assoSlug={assoSlug} />
      </Modal>
    </>
  );
}
