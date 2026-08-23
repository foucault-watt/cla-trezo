"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Save, User, UserPlus } from "lucide-react";
import type { AssoMember } from "@/lib/asso/members";
import {
  updateExpenseReportBeneficiaryAsAdminAction,
  type UpdateExpenseReportBeneficiaryAsAdminState,
} from "@/lib/admin/expense-report-actions";

const initialState: UpdateExpenseReportBeneficiaryAsAdminState = { ok: false };

type BeneficiaryDraft = {
  kind: "MEMBER" | "CUSTOM";
  memberId: string;
  customFirstname: string;
  customLastname: string;
  iban: string;
};

export function AdminBeneficiaryForm({
  reportId,
  members,
  beneficiary,
}: {
  reportId: string;
  members: AssoMember[];
  beneficiary: {
    userId: string | null;
    firstname: string;
    lastname: string;
    iban: string;
  };
}) {
  const [draft, setDraft] = useState<BeneficiaryDraft>({
    kind: beneficiary.userId ? "MEMBER" : "CUSTOM",
    memberId: beneficiary.userId ?? "",
    customFirstname: beneficiary.userId ? "" : beneficiary.firstname,
    customLastname: beneficiary.userId ? "" : beneficiary.lastname,
    iban: beneficiary.iban,
  });
  const [state, formAction, pending] = useActionState(
    updateExpenseReportBeneficiaryAsAdminAction,
    initialState,
  );
  const selectedMember = members.find((m) => m.userId === draft.memberId);

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-box border border-base-300 bg-base-100 p-5 shadow-md sm:p-6"
    >
      <input type="hidden" name="id" value={reportId} />
      <input type="hidden" name="beneficiaryKind" value={draft.kind} />
      <input
        type="hidden"
        name="beneficiaryUserId"
        value={draft.kind === "MEMBER" ? draft.memberId : ""}
      />
      {draft.kind === "MEMBER" && (
        <>
          <input
            type="hidden"
            name="beneficiaryFirstname"
            value={selectedMember?.firstname ?? ""}
          />
          <input
            type="hidden"
            name="beneficiaryLastname"
            value={selectedMember?.lastname ?? ""}
          />
        </>
      )}

      <div className="flex flex-wrap gap-2">
        {members.map((member) => {
          const selected =
            draft.kind === "MEMBER" && draft.memberId === member.userId;
          return (
            <button
              key={member.userId}
              type="button"
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  kind: "MEMBER",
                  memberId: member.userId,
                }))
              }
              className={`rounded-box border-2 px-4 py-2 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-base-300 hover:border-primary/50"
              }`}
              aria-pressed={selected}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <User size={14} />
                <span className="max-w-56 break-words">
                  {member.firstname} {member.lastname}
                </span>
              </span>
              <span className="block text-xs text-base-content/60">
                {member.role}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() =>
            setDraft((current) => ({ ...current, kind: "CUSTOM" }))
          }
          className={`rounded-box border-2 border-dashed px-4 py-2 text-left transition-colors ${
            draft.kind === "CUSTOM"
              ? "border-primary bg-primary/5"
              : "border-base-300 hover:border-primary/50"
          }`}
          aria-pressed={draft.kind === "CUSTOM"}
        >
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <UserPlus size={14} />
            Autre bénéficiaire
          </span>
        </button>
      </div>

      {draft.kind === "CUSTOM" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <fieldset className="fieldset min-w-0">
            <legend className="fieldset-legend">Prénom</legend>
            <input
              className="input w-full"
              name="beneficiaryFirstname"
              required
              maxLength={100}
              value={draft.customFirstname}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  customFirstname: event.target.value,
                }))
              }
            />
          </fieldset>
          <fieldset className="fieldset min-w-0">
            <legend className="fieldset-legend">Nom</legend>
            <input
              className="input w-full"
              name="beneficiaryLastname"
              required
              maxLength={100}
              value={draft.customLastname}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  customLastname: event.target.value,
                }))
              }
            />
          </fieldset>
        </div>
      )}

      <fieldset className="fieldset min-w-0">
        <legend className="fieldset-legend">IBAN</legend>
        <input
          className="input w-full font-mono tracking-wide uppercase"
          name="beneficiaryIban"
          placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
          autoComplete="off"
          spellCheck={false}
          required
          value={draft.iban}
          onChange={(event) =>
            setDraft((current) => ({ ...current, iban: event.target.value }))
          }
        />
      </fieldset>

      {!state.ok && state.error && (
        <div role="alert" className="alert alert-error alert-soft">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="inline-flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 size={15} />
          Enregistré.
        </div>
      )}

      <div className="flex justify-end">
        <button className="btn btn-primary" disabled={pending}>
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
  );
}
