"use client";

import { useActionState, useState } from "react";
import {
  addExpenseReportLineAction,
  type AddExpenseReportLineState,
} from "@/lib/expense-reports/expense-report-actions";
import { formatCents } from "@/lib/money";
import type { AssoType } from "@/app/generated/prisma/enums";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";
import type { TypeDepenseOption } from "@/lib/expense-reports/expense-reports";

const initialState: AddExpenseReportLineState = { ok: false };
const CUSTOM_TYPE_DEPENSE = "autre";

type FieldsState = {
  beneficiaryFirstname: string;
  beneficiaryLastname: string;
  iban: string;
  amount: string;
  typeDepenseChoice: string;
  customLabel: string;
  fundingSource: string;
  subventionId: string;
};

const emptyFields: FieldsState = {
  beneficiaryFirstname: "",
  beneficiaryLastname: "",
  iban: "",
  amount: "",
  typeDepenseChoice: "",
  customLabel: "",
  fundingSource: "",
  subventionId: "",
};

export function AddLigneForm({
  assoSlug,
  expenseReportId,
  assoType,
  typeDepenses,
  visibleSubventions,
}: {
  assoSlug: string;
  expenseReportId: string;
  assoType: AssoType | null;
  typeDepenses: TypeDepenseOption[];
  visibleSubventions: VisibleSubvention[];
}) {
  const [state, formAction, pending] = useActionState(
    addExpenseReportLineAction,
    initialState,
  );
  const [fields, setFields] = useState<FieldsState>(emptyFields);

  // Après chaque soumission, on resynchronise les champs affichés sur le
  // résultat du Server Action plutôt que de laisser le navigateur réinitialiser
  // le <form> : en échec, la saisie de l'utilisateur est restaurée telle
  // quelle (pas besoin de tout retaper) ; en succès, le formulaire redevient
  // vierge pour la prochaine Ligne. Ajusté pendant le rendu (cf. règle
  // react-hooks/set-state-in-effect), pas dans un effet.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.ok) {
      setFields(emptyFields);
    } else if (state.values) {
      const v = state.values;
      setFields({
        beneficiaryFirstname: v.beneficiaryFirstname,
        beneficiaryLastname: v.beneficiaryLastname,
        iban: v.iban,
        amount: v.amount,
        typeDepenseChoice: v.typeDepenseId || (v.customLabel ? CUSTOM_TYPE_DEPENSE : ""),
        customLabel: v.customLabel,
        fundingSource: v.fundingSource,
        subventionId: v.subventionId,
      });
    }
  }

  function setField<K extends keyof FieldsState>(key: K, value: FieldsState[K]) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  const canUseClubBalance = assoType === "CLUB";

  return (
    <div className="card border border-base-300 bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title">Ajouter une Ligne</h2>

        <form action={formAction} className="mt-2 flex flex-col gap-3">
          <input type="hidden" name="expenseReportId" value={expenseReportId} />
          <input type="hidden" name="assoSlug" value={assoSlug} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <fieldset className="fieldset flex-1">
              <legend className="fieldset-legend">Prénom</legend>
              <input
                type="text"
                name="beneficiaryFirstname"
                className="input w-full"
                value={fields.beneficiaryFirstname}
                onChange={(e) =>
                  setField("beneficiaryFirstname", e.target.value)
                }
                required
              />
            </fieldset>
            <fieldset className="fieldset flex-1">
              <legend className="fieldset-legend">Nom</legend>
              <input
                type="text"
                name="beneficiaryLastname"
                className="input w-full"
                value={fields.beneficiaryLastname}
                onChange={(e) =>
                  setField("beneficiaryLastname", e.target.value)
                }
                required
              />
            </fieldset>
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">IBAN</legend>
            <input
              type="text"
              name="iban"
              className="input w-full"
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              value={fields.iban}
              onChange={(e) => setField("iban", e.target.value)}
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
              className="input w-full"
              placeholder="0.00"
              value={fields.amount}
              onChange={(e) => setField("amount", e.target.value)}
              required
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Type de dépense</legend>
            <select
              className="select w-full"
              value={fields.typeDepenseChoice}
              onChange={(e) => setField("typeDepenseChoice", e.target.value)}
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
                className="input mt-2 w-full"
                placeholder="Libellé personnalisé"
                value={fields.customLabel}
                onChange={(e) => setField("customLabel", e.target.value)}
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
            <legend className="fieldset-legend">Source de financement</legend>
            <select
              name="fundingSource"
              className="select w-full"
              value={fields.fundingSource}
              onChange={(e) => setField("fundingSource", e.target.value)}
              required
            >
              <option value="" disabled>
                Choisir une source
              </option>
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
                className="select w-full"
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
              {visibleSubventions.length === 0 && (
                <p className="mt-1 text-xs text-warning">
                  Aucune Subvention Publiée disponible pour cette Structure.
                </p>
              )}
            </fieldset>
          )}

          {!state.ok && state.error && (
            <div role="alert" className="alert alert-error alert-soft">
              <span>{state.error}</span>
            </div>
          )}
          {state.ok && (
            <div role="alert" className="alert alert-success alert-soft">
              <span>Ligne ajoutée.</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Ajouter"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
