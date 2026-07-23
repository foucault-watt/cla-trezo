"use client";

import { useActionState } from "react";
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
  const [state, formAction, pending] = useActionState(
    updateSubventionCampaignAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="campaignId" value={campaignId} />

      <CampaignNameFields defaultType={type} defaultName={name} />

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Date</legend>
        <input
          type="date"
          name="date"
          className="input w-full"
          defaultValue={toDateInputValue(date)}
          required
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Date de publication</legend>
        <input
          type="date"
          name="publicationDate"
          className="input w-full"
          defaultValue={toDateInputValue(publicationDate)}
        />
        <p className="mt-1 text-xs whitespace-normal text-base-content/70">
          Videz le champ pour repasser la campagne en Programmée. Une date
          passée ou égale à aujourd&apos;hui la rend Publiée.
        </p>
      </fieldset>

      {!state.ok && state.error && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.error}</span>
        </div>
      )}
      {state.ok && (
        <div role="alert" className="alert alert-success alert-soft">
          <span>Campagne mise à jour.</span>
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          "Enregistrer"
        )}
      </button>
    </form>
  );
}
