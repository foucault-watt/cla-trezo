"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Modal,
  useModalAutoClose,
  type ModalHandle,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  updateSubventionCampaignAction,
  type UpdateSubventionCampaignState,
} from "@/lib/admin/subvention-campaign-actions";
import type { SubventionType } from "@/app/generated/prisma/enums";
import { CampaignNameFields } from "../../_components/campaign-name-fields";

const initialState: UpdateSubventionCampaignState = { ok: false };

function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function EditCampaignForm({
  campaignId,
  type,
  name,
  date,
  publicationDate,
}: {
  campaignId: string;
  type: SubventionType;
  name: string;
  date: Date;
  publicationDate: Date | null;
}) {
  const modalRef = useRef<ModalHandle>(null);
  const { push: pushToast } = useToast();
  const [state, formAction, pending] = useActionState(
    updateSubventionCampaignAction,
    initialState,
  );
  const [campaignDate, setCampaignDate] = useState(toDateInputValue(date));
  const [publicationDateValue, setPublicationDateValue] = useState(
    toDateInputValue(publicationDate),
  );
  useModalAutoClose(modalRef, state.ok);

  useEffect(() => {
    if (state.ok) {
      pushToast({ type: "success", message: "Campagne mise à jour." });
    } else if (state.error) {
      pushToast({ type: "error", message: state.error });
    }
  }, [state, pushToast]);

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
      <Modal ref={modalRef} title="Modifier la campagne">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="campaignId" value={campaignId} />

          <CampaignNameFields defaultType={type} defaultName={name} />

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Date</legend>
            <DatePicker
              name="date"
              value={campaignDate}
              onChange={setCampaignDate}
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Date de publication</legend>
            <DatePicker
              name="publicationDate"
              value={publicationDateValue}
              onChange={setPublicationDateValue}
              clearable
              placeholder="Non publiée"
            />
            <p className="mt-1 text-xs whitespace-normal text-base-content/70">
              Videz le champ pour repasser la campagne en Programmée. Une
              date passée ou égale à aujourd&apos;hui la rend Publiée.
            </p>
          </fieldset>

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
              type="submit"
              className="btn btn-primary"
              disabled={pending || !campaignDate}
            >
              {pending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <Save size={16} />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
