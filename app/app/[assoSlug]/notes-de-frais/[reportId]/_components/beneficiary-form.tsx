"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, User, UserPlus } from "lucide-react";
import type { AssoMember } from "@/lib/asso/members";
import {
  updateExpenseReportBeneficiaryAction,
  type UpdateExpenseReportBeneficiaryState,
} from "@/lib/expense-reports/expense-report-actions";
import { expenseReportStepHref } from "@/lib/expense-reports/expense-report-steps";

const initialState: UpdateExpenseReportBeneficiaryState = { ok: false };

export function BeneficiaryForm({
  assoSlug,
  reportId,
  members,
  beneficiary,
  backHref,
}: {
  assoSlug: string;
  reportId: string;
  members: AssoMember[];
  beneficiary: {
    userId: string | null;
    firstname: string | null;
    lastname: string | null;
    ibanLast4: string | null;
  };
  backHref: string;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<"MEMBER" | "CUSTOM">(
    beneficiary.userId ? "MEMBER" : "CUSTOM",
  );
  const [memberId, setMemberId] = useState(beneficiary.userId ?? "");
  const [customFirstname, setCustomFirstname] = useState(
    beneficiary.userId ? "" : (beneficiary.firstname ?? ""),
  );
  const [customLastname, setCustomLastname] = useState(
    beneficiary.userId ? "" : (beneficiary.lastname ?? ""),
  );
  const selectedMember = members.find((member) => member.userId === memberId);
  const [state, formAction, pending] = useActionState(
    updateExpenseReportBeneficiaryAction,
    initialState,
  );
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.ok)
      router.push(expenseReportStepHref(assoSlug, reportId, "recapitulatif"));
  }

  const firstname =
    kind === "MEMBER" ? (selectedMember?.firstname ?? "") : customFirstname;
  const lastname =
    kind === "MEMBER" ? (selectedMember?.lastname ?? "") : customLastname;

  return (
    <form action={formAction} className="max-w-2xl">
      <input type="hidden" name="id" value={reportId} />
      <input type="hidden" name="assoSlug" value={assoSlug} />
      <input type="hidden" name="beneficiaryKind" value={kind} />
      <input
        type="hidden"
        name="beneficiaryUserId"
        value={kind === "MEMBER" ? memberId : ""}
      />

      <div className="card border border-base-300 bg-base-100">
        <div className="card-body gap-5">
          <div className="flex flex-wrap gap-2">
            {members.map((member) => {
              const selected = kind === "MEMBER" && memberId === member.userId;
              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => {
                    setKind("MEMBER");
                    setMemberId(member.userId);
                  }}
                  className={`rounded-box border-2 px-4 py-2 text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-base-300 hover:border-primary/50"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <User size={14} />
                    {member.firstname} {member.lastname}
                  </span>
                  <span className="block text-xs text-base-content/60">
                    {member.role}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setKind("CUSTOM")}
              className={`rounded-box border-2 border-dashed px-4 py-2 text-left transition-colors ${
                kind === "CUSTOM"
                  ? "border-primary bg-primary/5"
                  : "border-base-300 hover:border-primary/50"
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <UserPlus size={14} />
                Autre bénéficiaire
              </span>
            </button>
          </div>

          {kind === "MEMBER" ? (
            <>
              <input
                type="hidden"
                name="beneficiaryFirstname"
                value={firstname}
              />
              <input
                type="hidden"
                name="beneficiaryLastname"
                value={lastname}
              />
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Prénom</legend>
                <input
                  className="input w-full"
                  name="beneficiaryFirstname"
                  required
                  value={customFirstname}
                  onChange={(event) => setCustomFirstname(event.target.value)}
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Nom</legend>
                <input
                  className="input w-full"
                  name="beneficiaryLastname"
                  required
                  value={customLastname}
                  onChange={(event) => setCustomLastname(event.target.value)}
                />
              </fieldset>
            </div>
          )}
          <fieldset className="fieldset">
            <legend className="fieldset-legend">IBAN</legend>
            {beneficiary.ibanLast4 && (
              <p className="mb-2 text-sm text-base-content/70">
                IBAN enregistré : FR•• •••• •••• {beneficiary.ibanLast4}.
                Laissez vide pour le conserver.
              </p>
            )}
            <input
              className="input w-full"
              name="beneficiaryIban"
              required={!beneficiary.ibanLast4}
              placeholder={
                beneficiary.ibanLast4
                  ? "Saisir uniquement pour remplacer l’IBAN"
                  : "FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              }
              autoComplete="off"
            />
          </fieldset>
          {!state.ok && state.error && (
            <div role="alert" className="alert alert-error alert-soft">
              {state.error}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-3">
        <Link className="btn btn-ghost" href={backHref}>
          <ArrowLeft size={16} />
          Retour
        </Link>
        <button
          className="btn btn-primary"
          disabled={pending || (kind === "MEMBER" && !memberId)}
        >
          {pending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <>
              Enregistrer et continuer
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
