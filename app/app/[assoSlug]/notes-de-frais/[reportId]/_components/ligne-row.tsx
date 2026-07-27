"use client";

import { useActionState, useState } from "react";
import {
  updateExpenseReportLineAction,
  type UpdateExpenseReportLineState,
} from "@/lib/expense-reports/expense-report-actions";
import { fundingSourceLabel } from "@/lib/expense-reports/labels";
import { formatCents } from "@/lib/money";
import type { AssoType } from "@/app/generated/prisma/enums";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";
import type {
  ExpenseReportLineDetail,
  TypeDepenseOption,
} from "@/lib/expense-reports/expense-reports";

const initialState: UpdateExpenseReportLineState = { ok: false };
const CUSTOM_TYPE_DEPENSE = "autre";

type FieldsState = {
  beneficiaryFirstname: string;
  beneficiaryLastname: string;
  iban: string;
  amount: string;
  expenseName: string;
  typeDepenseChoice: string;
  customLabel: string;
  fundingSource: string;
  subventionId: string;
};

function fieldsFromLine(line: ExpenseReportLineDetail): FieldsState {
  return {
    beneficiaryFirstname: line.beneficiaryFirstname,
    beneficiaryLastname: line.beneficiaryLastname,
    iban: line.iban ?? "",
    amount: (line.amountCents / 100).toFixed(2),
    expenseName: line.expenseName,
    typeDepenseChoice: line.typeDepenseId ?? CUSTOM_TYPE_DEPENSE,
    customLabel: line.customLabel ?? "",
    fundingSource: line.fundingSource,
    subventionId: line.subventionId ?? "",
  };
}

export function LigneRow({
  assoSlug,
  line,
  assoType,
  typeDepenses,
  visibleSubventions,
  editable,
}: {
  assoSlug: string;
  line: ExpenseReportLineDetail;
  assoType: AssoType | null;
  typeDepenses: TypeDepenseOption[];
  visibleSubventions: VisibleSubvention[];
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateExpenseReportLineAction,
    initialState,
  );
  const [fields, setFields] = useState<FieldsState>(() => fieldsFromLine(line));

  // Après chaque soumission, on resynchronise les champs affichés sur le
  // résultat du Server Action plutôt que de laisser le navigateur réinitialiser
  // le <form> : en échec, la saisie de l'utilisateur est restaurée telle
  // quelle (pas besoin de tout retaper) ; en succès, le panneau se referme.
  // Ajusté pendant le rendu (cf. règle react-hooks/set-state-in-effect), pas
  // dans un effet.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.ok && editing) {
      setEditing(false);
    } else if (!state.ok && state.values) {
      const v = state.values;
      setFields({
        beneficiaryFirstname: v.beneficiaryFirstname,
        beneficiaryLastname: v.beneficiaryLastname,
        iban: v.iban,
        amount: v.amount,
        expenseName: v.expenseName,
        typeDepenseChoice:
          v.typeDepenseId || (v.customLabel ? CUSTOM_TYPE_DEPENSE : ""),
        customLabel: v.customLabel,
        fundingSource: v.fundingSource,
        subventionId: v.subventionId,
      });
    }
  }

  function setField<K extends keyof FieldsState>(
    key: K,
    value: FieldsState[K],
  ) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  function toggleEditing() {
    if (!editing) {
      setFields(fieldsFromLine(line));
    }
    setEditing((value) => !value);
  }

  const canUseClubBalance = assoType === "CLUB";
  const sourceDetail =
    line.fundingSource === "SUBVENTION" && line.subventionReason
      ? `${fundingSourceLabel[line.fundingSource]} — ${line.subventionReason}`
      : fundingSourceLabel[line.fundingSource];

  return (
    <>
      <tr className="hover">
        <td>
          {line.beneficiaryFirstname} {line.beneficiaryLastname}
        </td>
        <td>{line.expenseName}</td>
        <td>{line.typeDepenseLabel ?? line.customLabel}</td>
        <td>{formatCents(line.amountCents)}</td>
        <td>{sourceDetail}</td>
        <td>
          {editable && (
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={toggleEditing}
            >
              {editing ? "Annuler" : "Modifier"}
            </button>
          )}
        </td>
      </tr>
      {editable && editing && (
        <tr>
          <td colSpan={6}>
            <form action={formAction} className="flex flex-col gap-3 py-2">
              <input type="hidden" name="id" value={line.id} />
              <input type="hidden" name="assoSlug" value={assoSlug} />

              <div className="flex flex-col gap-2 sm:flex-row">
                <fieldset className="fieldset flex-1">
                  <legend className="fieldset-legend">Prénom</legend>
                  <input
                    type="text"
                    name="beneficiaryFirstname"
                    value={fields.beneficiaryFirstname}
                    onChange={(e) =>
                      setField("beneficiaryFirstname", e.target.value)
                    }
                    className="input input-sm w-full"
                    required
                  />
                </fieldset>
                <fieldset className="fieldset flex-1">
                  <legend className="fieldset-legend">Nom</legend>
                  <input
                    type="text"
                    name="beneficiaryLastname"
                    value={fields.beneficiaryLastname}
                    onChange={(e) =>
                      setField("beneficiaryLastname", e.target.value)
                    }
                    className="input input-sm w-full"
                    required
                  />
                </fieldset>
              </div>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">IBAN</legend>
                <input
                  type="text"
                  name="iban"
                  value={fields.iban}
                  onChange={(e) => setField("iban", e.target.value)}
                  className="input input-sm w-full"
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Montant (€)</legend>
                <input
                  type="number"
                  name="amount"
                  min="0.01"
                  step="0.01"
                  value={fields.amount}
                  onChange={(e) => setField("amount", e.target.value)}
                  className="input input-sm w-32"
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Nom de la dépense</legend>
                <input
                  type="text"
                  name="expenseName"
                  value={fields.expenseName}
                  onChange={(e) => setField("expenseName", e.target.value)}
                  className="input input-sm w-full"
                  required
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Type de dépense</legend>
                <select
                  className="select select-sm w-full"
                  value={fields.typeDepenseChoice}
                  onChange={(e) =>
                    setField("typeDepenseChoice", e.target.value)
                  }
                  required
                >
                  <option value="" disabled>
                    Choisir un Type de dépense
                  </option>
                  {typeDepenses.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                  <option value={CUSTOM_TYPE_DEPENSE}>Autre (préciser)</option>
                </select>
                {fields.typeDepenseChoice === CUSTOM_TYPE_DEPENSE ? (
                  <input
                    type="text"
                    name="customLabel"
                    value={fields.customLabel}
                    onChange={(e) => setField("customLabel", e.target.value)}
                    className="input input-sm mt-2 w-full"
                    placeholder="Libellé personnalisé"
                    required
                  />
                ) : (
                  <input
                    type="hidden"
                    name="typeDepenseId"
                    value={fields.typeDepenseChoice}
                  />
                )}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Source de financement
                </legend>
                <select
                  name="fundingSource"
                  className="select select-sm w-full"
                  value={fields.fundingSource}
                  onChange={(e) => setField("fundingSource", e.target.value)}
                  required
                >
                  {canUseClubBalance && (
                    <option value="CLUB_BALANCE">Solde</option>
                  )}
                  <option value="SUBVENTION">Subvention</option>
                </select>
              </fieldset>

              {fields.fundingSource === "SUBVENTION" && (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Subvention</legend>
                  <select
                    name="subventionId"
                    className="select select-sm w-full"
                    value={fields.subventionId}
                    onChange={(e) => setField("subventionId", e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Choisir une Subvention
                    </option>
                    {visibleSubventions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.reason} — reste {formatCents(s.remainingAmountCents)}
                      </option>
                    ))}
                  </select>
                </fieldset>
              )}

              {!state.ok && state.error && (
                <div
                  role="alert"
                  className="alert alert-error alert-soft alert-sm"
                >
                  <span>{state.error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-sm self-start"
                disabled={pending}
              >
                {pending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  "Enregistrer"
                )}
              </button>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
