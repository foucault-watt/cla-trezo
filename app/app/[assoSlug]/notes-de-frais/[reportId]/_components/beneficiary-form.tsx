"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  TriangleAlert,
  User,
  UserPlus,
  X,
} from "lucide-react";
import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";
import {
  Modal,
  useModalAutoClose,
  type ModalHandle,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { AssoMember } from "@/lib/asso/members";
import {
  submitExpenseReportWithBeneficiaryAction,
  updateExpenseReportBeneficiaryAction,
  type SubmitExpenseReportState,
  type UpdateExpenseReportBeneficiaryState,
} from "@/lib/expense-reports/expense-report-actions";
import { formatCents } from "@/lib/money";
import { pluralize } from "@/lib/plural";
import { DeleteExpenseReportButton } from "./delete-expense-report-button";

const initialSaveState: UpdateExpenseReportBeneficiaryState = { ok: false };
const initialSubmitState: SubmitExpenseReportState = { ok: false };

type BeneficiaryDraft = {
  kind: "MEMBER" | "CUSTOM";
  memberId: string;
  customFirstname: string;
  customLastname: string;
  iban: string;
};

function normalizeIdentityPart(value: string) {
  return value.trim().toLocaleLowerCase("fr-FR");
}

function normalizeIban(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function validIban(value: string) {
  return /^[A-Z0-9]{15,34}$/.test(normalizeIban(value));
}

function memberForDraft(draft: BeneficiaryDraft, members: AssoMember[]) {
  return members.find((member) => member.userId === draft.memberId);
}

function beneficiaryNames(draft: BeneficiaryDraft, members: AssoMember[]) {
  const member = memberForDraft(draft, members);
  return draft.kind === "MEMBER"
    ? {
        firstname: member?.firstname ?? "",
        lastname: member?.lastname ?? "",
      }
    : {
        firstname: draft.customFirstname,
        lastname: draft.customLastname,
      };
}

function identitySignature(draft: BeneficiaryDraft, members: AssoMember[]) {
  if (draft.kind === "MEMBER") return `MEMBER:${draft.memberId}`;
  const { firstname, lastname } = beneficiaryNames(draft, members);
  return `CUSTOM:${normalizeIdentityPart(firstname)}:${normalizeIdentityPart(lastname)}`;
}

function draftSignature(draft: BeneficiaryDraft, members: AssoMember[]) {
  return JSON.stringify({
    identity: identitySignature(draft, members),
    iban: normalizeIban(draft.iban),
  });
}

function draftIsComplete({
  draft,
  members,
  persistedIdentity,
  persistedHasIban,
}: {
  draft: BeneficiaryDraft;
  members: AssoMember[];
  persistedIdentity: string;
  persistedHasIban: boolean;
}) {
  const { firstname, lastname } = beneficiaryNames(draft, members);
  const identityComplete =
    firstname.trim().length > 0 &&
    lastname.trim().length > 0 &&
    (draft.kind === "CUSTOM" || Boolean(memberForDraft(draft, members)));
  if (!identityComplete) return false;
  if (draft.iban.trim()) return validIban(draft.iban);
  return (
    persistedHasIban && identitySignature(draft, members) === persistedIdentity
  );
}

function currentBeneficiaryName(
  draft: BeneficiaryDraft,
  members: AssoMember[],
) {
  const { firstname, lastname } = beneficiaryNames(draft, members);
  return [firstname.trim(), lastname.trim()].filter(Boolean).join(" ");
}

function SubmitCurrentBeneficiaryForm({
  assoSlug,
  reportId,
  draft,
  members,
  beneficiaryName,
  reimbursementsCount,
  totalAmountCents,
  documentsCount,
  warnings,
  disabled,
}: {
  assoSlug: string;
  reportId: string;
  draft: BeneficiaryDraft;
  members: AssoMember[];
  beneficiaryName: string;
  reimbursementsCount: number;
  totalAmountCents: number;
  documentsCount: number;
  warnings: string[];
  disabled: boolean;
}) {
  const modalRef = useRef<ModalHandle>(null);
  const { push: pushToast } = useToast();
  const [state, formAction, pending] = useActionState(
    submitExpenseReportWithBeneficiaryAction,
    initialSubmitState,
  );
  useModalAutoClose(modalRef, state.ok);
  const names = beneficiaryNames(draft, members);

  useEffect(() => {
    if (state.ok) {
      pushToast({
        type: "success",
        message: "La Note de frais a bien été soumise à l'Admin CLA.",
      });
    } else if (state.error) {
      pushToast({ type: "error", message: state.error });
    }
  }, [state, pushToast]);

  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        disabled={disabled || pending}
        onClick={() => modalRef.current?.open()}
      >
        <Send size={17} />
        Soumettre la Note de frais
      </button>
      <Modal ref={modalRef} title="Soumettre cette Note de frais ?">
        <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-2 text-sm">
          <dt className="text-base-content/70">Bénéficiaire</dt>
          <dd className="max-w-64 text-right font-medium break-words">
            {beneficiaryName}
          </dd>
          <dt className="text-base-content/70">Dépenses</dt>
          <dd className="font-medium tabular-nums">{reimbursementsCount}</dd>
          <dt className="text-base-content/70">Montant total</dt>
          <dd className="font-medium tabular-nums">
            {formatCents(totalAmountCents)}
          </dd>
          <dt className="text-base-content/70">Justificatifs</dt>
          <dd className="font-medium tabular-nums">{documentsCount}</dd>
        </dl>
        {warnings.length > 0 && (
          <div className="alert alert-warning alert-soft mt-4">
            <TriangleAlert size={18} className="shrink-0" />
            <div>
              <p className="font-medium">
                {pluralize(
                  warnings.length,
                  "alerte non bloquante",
                  "alertes non bloquantes",
                )}
              </p>
              <ul className="mt-1 list-disc ps-4 text-sm">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <p className="mt-4 text-sm text-base-content/70">
          La note restera modifiable jusqu&apos;à sa prise en charge par
          l&apos;Admin CLA.
        </p>
        <form action={formAction} className="modal-action">
          <input type="hidden" name="id" value={reportId} />
          <input type="hidden" name="assoSlug" value={assoSlug} />
          <input type="hidden" name="beneficiaryKind" value={draft.kind} />
          <input
            type="hidden"
            name="beneficiaryUserId"
            value={draft.kind === "MEMBER" ? draft.memberId : ""}
          />
          <input
            type="hidden"
            name="beneficiaryFirstname"
            value={names.firstname}
          />
          <input
            type="hidden"
            name="beneficiaryLastname"
            value={names.lastname}
          />
          <input
            type="hidden"
            name="beneficiaryIban"
            value={normalizeIban(draft.iban)}
          />
          <button
            type="button"
            className="btn"
            onClick={() => modalRef.current?.close()}
          >
            <X size={16} />
            Annuler
          </button>
          <button className="btn btn-primary" disabled={pending}>
            {pending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <Send size={16} />
                Soumettre la note
              </>
            )}
          </button>
        </form>
      </Modal>
    </>
  );
}

export function BeneficiaryForm({
  assoSlug,
  reportId,
  members,
  currentUserId,
  beneficiary,
  reportStatus,
  reportTitle,
  reimbursementsCount,
  totalAmountCents,
  documentsCount,
  warnings,
  backHref,
}: {
  assoSlug: string;
  reportId: string;
  members: AssoMember[];
  currentUserId: string;
  beneficiary: {
    userId: string | null;
    firstname: string | null;
    lastname: string | null;
    ibanLast4: string | null;
  };
  reportStatus: ExpenseReportStatus;
  reportTitle: string;
  reimbursementsCount: number;
  totalAmountCents: number;
  documentsCount: number;
  warnings: string[];
  backHref: string;
}) {
  const persistedDraft: BeneficiaryDraft = {
    kind: beneficiary.userId ? "MEMBER" : "CUSTOM",
    memberId: beneficiary.userId ?? "",
    customFirstname: beneficiary.userId ? "" : (beneficiary.firstname ?? ""),
    customLastname: beneficiary.userId ? "" : (beneficiary.lastname ?? ""),
    iban: "",
  };
  // Sans bénéficiaire enregistré, on présélectionne la personne connectée :
  // c'est le cas le plus courant, il ne reste qu'à saisir son IBAN.
  const hasPersistedBeneficiary = Boolean(
    beneficiary.userId || beneficiary.firstname || beneficiary.lastname,
  );
  const initialDraft: BeneficiaryDraft =
    !hasPersistedBeneficiary &&
    members.some((member) => member.userId === currentUserId)
      ? { ...persistedDraft, kind: "MEMBER", memberId: currentUserId }
      : persistedDraft;
  const initialPersistedIdentity = identitySignature(persistedDraft, members);
  const initialSignature = draftSignature(persistedDraft, members);
  const formRef = useRef<HTMLFormElement>(null);
  const latestDraftRef = useRef(initialDraft);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const lastSavedSignatureRef = useRef(initialSignature);
  const persistedIdentityRef = useRef(initialPersistedIdentity);
  const persistedHasIbanRef = useRef(Boolean(beneficiary.ibanLast4));
  const [draft, setDraft] = useState(initialDraft);
  const [lastSavedSignature, setLastSavedSignature] =
    useState(initialSignature);
  const [persistedIdentity, setPersistedIdentity] = useState(
    initialPersistedIdentity,
  );
  const [persistedHasIban, setPersistedHasIban] = useState(
    Boolean(beneficiary.ibanLast4),
  );
  const [lastAttemptedSignature, setLastAttemptedSignature] = useState("");
  const [state, formAction, pending] = useActionState(
    async (
      previousState: UpdateExpenseReportBeneficiaryState,
      formData: FormData,
    ) => {
      const submittedSignature = String(
        formData.get("clientValuesSignature") ?? "",
      );
      const submittedIdentity = String(
        formData.get("clientIdentitySignature") ?? "",
      );
      const result = await updateExpenseReportBeneficiaryAction(
        previousState,
        formData,
      );
      saveInFlightRef.current = false;
      if (result.ok) {
        lastSavedSignatureRef.current = submittedSignature;
        persistedIdentityRef.current = submittedIdentity;
        persistedHasIbanRef.current = true;
        setLastSavedSignature(submittedSignature);
        setPersistedIdentity(submittedIdentity);
        setPersistedHasIban(true);
      }
      const latestSignature = draftSignature(latestDraftRef.current, members);
      if (
        saveQueuedRef.current ||
        (result.ok && latestSignature !== submittedSignature)
      ) {
        saveQueuedRef.current = false;
        setTimeout(() => {
          const current = latestDraftRef.current;
          const signature = draftSignature(current, members);
          const complete = draftIsComplete({
            draft: current,
            members,
            persistedIdentity: persistedIdentityRef.current,
            persistedHasIban: persistedHasIbanRef.current,
          });
          if (!complete || signature === lastSavedSignatureRef.current) return;
          saveInFlightRef.current = true;
          setLastAttemptedSignature(signature);
          formRef.current?.requestSubmit();
        }, 0);
      }
      return result;
    },
    initialSaveState,
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  function isComplete(next: BeneficiaryDraft) {
    return draftIsComplete({
      draft: next,
      members,
      persistedIdentity: persistedIdentityRef.current,
      persistedHasIban: persistedHasIbanRef.current,
    });
  }

  function requestSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const current = latestDraftRef.current;
    const signature = draftSignature(current, members);
    if (!isComplete(current) || signature === lastSavedSignatureRef.current) {
      return;
    }
    if (saveInFlightRef.current) {
      saveQueuedRef.current = true;
      return;
    }
    saveInFlightRef.current = true;
    setLastAttemptedSignature(signature);
    formRef.current?.requestSubmit();
  }

  function updateDraft(next: BeneficiaryDraft) {
    latestDraftRef.current = next;
    setDraft(next);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (isComplete(next)) {
      saveTimerRef.current = setTimeout(requestSave, 650);
    }
  }

  const names = beneficiaryNames(draft, members);
  const currentIdentity = identitySignature(draft, members);
  const currentSignature = draftSignature(draft, members);
  const complete = draftIsComplete({
    draft,
    members,
    persistedIdentity,
    persistedHasIban,
  });
  const dirty = currentSignature !== lastSavedSignature;
  const identityChanged = currentIdentity !== persistedIdentity;
  const typedIbanInvalid = Boolean(draft.iban.trim()) && !validIban(draft.iban);
  // L'avertissement « l'ancien ne sera pas réutilisé » n'a de sens que s'il
  // existe réellement un IBAN enregistré pour un autre bénéficiaire.
  const ibanReplacedWarning =
    persistedHasIban && identityChanged && !draft.iban.trim();
  const ibanHintVisible =
    (persistedHasIban && !identityChanged) || ibanReplacedWarning;
  const beneficiaryName = currentBeneficiaryName(draft, members);
  const saveError =
    !pending &&
    !state.ok &&
    state.error &&
    currentSignature === lastAttemptedSignature
      ? state.error
      : null;

  return (
    <div className="space-y-5">
      <form
        ref={formRef}
        action={formAction}
        className="rounded-box border border-base-300 bg-base-100 shadow-md"
        onBlurCapture={(event) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
            requestSave();
          }
        }}
        onKeyDownCapture={(event) => {
          if (
            event.key === "Enter" &&
            event.target instanceof HTMLInputElement
          ) {
            event.preventDefault();
            requestSave();
          }
        }}
        onSubmit={() => {
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveInFlightRef.current = true;
        }}
      >
        <input type="hidden" name="id" value={reportId} />
        <input type="hidden" name="assoSlug" value={assoSlug} />
        <input type="hidden" name="beneficiaryKind" value={draft.kind} />
        <input
          type="hidden"
          name="beneficiaryUserId"
          value={draft.kind === "MEMBER" ? draft.memberId : ""}
        />
        <input
          type="hidden"
          name="beneficiaryFirstname"
          value={names.firstname}
        />
        <input
          type="hidden"
          name="beneficiaryLastname"
          value={names.lastname}
        />
        <input
          type="hidden"
          name="clientValuesSignature"
          value={currentSignature}
        />
        <input
          type="hidden"
          name="clientIdentitySignature"
          value={currentIdentity}
        />

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {members.map((member) => {
              const selected =
                draft.kind === "MEMBER" && draft.memberId === member.userId;
              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() =>
                    updateDraft({
                      ...latestDraftRef.current,
                      kind: "MEMBER",
                      memberId: member.userId,
                      iban: "",
                    })
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
                updateDraft({
                  ...latestDraftRef.current,
                  kind: "CUSTOM",
                  memberId: "",
                  iban: "",
                })
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
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <fieldset className="fieldset min-w-0">
                <legend className="fieldset-legend">Prénom</legend>
                <input
                  className="input w-full"
                  name="beneficiaryFirstnameVisible"
                  required
                  maxLength={100}
                  autoComplete="given-name"
                  value={draft.customFirstname}
                  onChange={(event) =>
                    updateDraft({
                      ...latestDraftRef.current,
                      customFirstname: event.target.value,
                    })
                  }
                />
              </fieldset>
              <fieldset className="fieldset min-w-0">
                <legend className="fieldset-legend">Nom</legend>
                <input
                  className="input w-full"
                  name="beneficiaryLastnameVisible"
                  required
                  maxLength={100}
                  autoComplete="family-name"
                  value={draft.customLastname}
                  onChange={(event) =>
                    updateDraft({
                      ...latestDraftRef.current,
                      customLastname: event.target.value,
                    })
                  }
                />
              </fieldset>
            </div>
          )}

          <fieldset className="fieldset mt-5 min-w-0">
            <legend className="fieldset-legend">IBAN</legend>
            {persistedHasIban && !identityChanged && (
              <p
                id="beneficiary-iban-hint"
                className="mb-2 text-sm text-base-content/70"
              >
                IBAN enregistré : •••• {beneficiary.ibanLast4 ?? "••••"}.
                Laissez vide pour le conserver.
              </p>
            )}
            {ibanReplacedWarning && (
              <p
                id="beneficiary-iban-hint"
                className="mb-2 text-sm text-warning"
              >
                Le bénéficiaire a changé : renseignez son IBAN. L’ancien ne sera
                pas réutilisé.
              </p>
            )}
            <input
              className="input w-full font-mono tracking-wide uppercase"
              name="beneficiaryIban"
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              autoComplete="off"
              spellCheck={false}
              aria-describedby={
                [
                  ibanHintVisible ? "beneficiary-iban-hint" : "",
                  typedIbanInvalid ? "beneficiary-iban-error" : "",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              aria-invalid={typedIbanInvalid}
              value={draft.iban}
              onChange={(event) =>
                updateDraft({
                  ...latestDraftRef.current,
                  iban: event.target.value,
                })
              }
            />
            {typedIbanInvalid && (
              <p
                id="beneficiary-iban-error"
                className="mt-1 text-xs text-error"
              >
                L’IBAN doit contenir entre 15 et 34 caractères alphanumériques.
              </p>
            )}
          </fieldset>

          <div
            className="mt-4 min-h-5 text-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            {pending ? (
              <span className="inline-flex items-center gap-2 text-base-content/60">
                <span className="loading loading-spinner loading-xs" />
                Enregistrement…
              </span>
            ) : saveError ? (
              <span role="alert" className="text-error">
                {saveError} Modifiez le champ pour réessayer.
              </span>
            ) : !complete && dirty ? (
              typedIbanInvalid ? (
                <span className="text-warning">
                  Corrigez l’IBAN pour enregistrer.
                </span>
              ) : (
                <span className="text-base-content/60">
                  {beneficiaryName
                    ? `Renseignez l’IBAN de ${beneficiaryName} pour enregistrer.`
                    : "Complétez le bénéficiaire et son IBAN."}
                </span>
              )
            ) : dirty ? (
              <span className="text-base-content/50">Modification…</span>
            ) : state.ok ? (
              <span className="inline-flex items-center gap-1.5 text-success">
                <CheckCircle2 size={15} />
                Enregistré automatiquement
              </span>
            ) : (
              <span className="text-base-content/50">
                Les modifications sont enregistrées automatiquement.
              </span>
            )}
          </div>
        </div>
      </form>

      <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-semibold">
              {complete && !dirty && !pending
                ? "Prête à être envoyée"
                : "Bénéficiaire à compléter"}
            </h3>
            <p className="mt-1 text-sm text-base-content/60 break-words">
              {pluralize(reimbursementsCount, "dépense")},{" "}
              {pluralize(documentsCount, "justificatif")}
              {beneficiaryName ? ` pour ${beneficiaryName}` : ""}.
            </p>
          </div>
          <p className="text-2xl font-semibold tabular-nums">
            {formatCents(totalAmountCents)}
          </p>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0 text-success" />
            {pluralize(
              reimbursementsCount,
              "dépense renseignée",
              "dépenses renseignées",
            )}
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0 text-success" />
            {pluralize(documentsCount, "justificatif ajouté", "justificatifs ajoutés")}
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2
              size={15}
              className={
                complete && !dirty && !pending
                  ? "shrink-0 text-success"
                  : "shrink-0 text-base-content/30"
              }
            />
            {complete && !dirty && !pending
              ? `IBAN enregistré pour ${beneficiaryName}`
              : "Bénéficiaire et IBAN à compléter"}
          </li>
        </ul>
      </section>

      {reportStatus === "SUBMITTED" && (
        <div className="alert alert-success alert-soft">
          <CheckCircle2 size={18} />
          Cette Note de frais a été soumise. Vous pouvez encore la modifier tant
          que l&apos;Admin CLA ne l&apos;a pas prise en charge.
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn btn-ghost" href={backHref}>
            <ArrowLeft size={16} />
            Retour aux dépenses
          </Link>
          {reportStatus === "DRAFT" && (
            <DeleteExpenseReportButton
              assoSlug={assoSlug}
              reportId={reportId}
              title={reportTitle}
            />
          )}
        </div>
        {reportStatus === "DRAFT" && (
          <SubmitCurrentBeneficiaryForm
            assoSlug={assoSlug}
            reportId={reportId}
            draft={draft}
            members={members}
            beneficiaryName={beneficiaryName}
            reimbursementsCount={reimbursementsCount}
            totalAmountCents={totalAmountCents}
            documentsCount={documentsCount}
            warnings={warnings}
            disabled={!complete || dirty || pending || Boolean(saveError)}
          />
        )}
      </div>
    </div>
  );
}
