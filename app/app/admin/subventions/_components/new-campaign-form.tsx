"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/toast";
import {
  createSubventionCampaignAction,
  type CreateSubventionCampaignState,
} from "@/lib/admin/subvention-campaign-actions";
import { CampaignNameFields } from "./campaign-name-fields";

const initialState: CreateSubventionCampaignState = { ok: false };

export function NewCampaignForm() {
  const router = useRouter();
  const { push: pushToast } = useToast();
  const [state, formAction, pending] = useActionState(
    createSubventionCampaignAction,
    initialState,
  );
  const today = new Date().toISOString().slice(0, 10);
  const [campaignDate, setCampaignDate] = useState(today);
  const [publicationDate, setPublicationDate] = useState(today);

  useEffect(() => {
    if (state.ok && state.campaignId) {
      pushToast({ type: "success", message: "Campagne créée." });
      router.push(`/app/admin/subventions/${state.campaignId}`);
    } else if (!state.ok && state.error) {
      pushToast({ type: "error", message: state.error });
    }
  }, [state, router, pushToast]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <CampaignNameFields />

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
          value={publicationDate}
          onChange={setPublicationDate}
          clearable
          placeholder="Non publiée"
        />
        <p className="mt-1 text-xs whitespace-normal text-base-content/70">
          Publiée dès aujourd&apos;hui par défaut. Choisissez une date future
          pour garder la campagne Programmée en attendant, ou videz le champ
          pour ne pas encore la publier.
        </p>
      </fieldset>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={pending || !campaignDate}
      >
        {pending ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          "Créer la campagne"
        )}
      </button>
    </form>
  );
}
