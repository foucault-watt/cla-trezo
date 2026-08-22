"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/ui/date-picker";
import {
  createSubventionCampaignAction,
  type CreateSubventionCampaignState,
} from "@/lib/admin/subvention-campaign-actions";
import { CampaignNameFields } from "./campaign-name-fields";

const initialState: CreateSubventionCampaignState = { ok: false };

export function NewCampaignForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createSubventionCampaignAction,
    initialState,
  );
  const today = new Date().toISOString().slice(0, 10);
  const [campaignDate, setCampaignDate] = useState(today);
  const [publicationDate, setPublicationDate] = useState(today);

  useEffect(() => {
    if (state.ok && state.campaignId) {
      router.push(`/app/admin/subventions/${state.campaignId}`);
    }
  }, [state, router]);

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

      {!state.ok && state.error && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.error}</span>
        </div>
      )}

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
