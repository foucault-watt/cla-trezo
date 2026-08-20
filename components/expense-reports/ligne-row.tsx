"use client";

import { useActionState, useState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import type {
  ExpenseReportLineDeleteState,
  ExpenseReportLineFormState,
} from "@/lib/expense-reports/expense-report-line-shared";
import { fundingSourceDetail, fundingSourceLabel } from "@/lib/expense-reports/labels";
import { formatCents } from "@/lib/money";
import type { AssoType, FundingSourceType } from "@/app/generated/prisma/enums";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";
import type {
  ExpenseReportLineDetail,
  TypeDepenseOption,
} from "@/lib/expense-reports/expense-reports";
import { useSubventionSelectionConsumer } from "./subvention-selection-context";

const initialState: ExpenseReportLineFormState = { ok: false };
const initialDeleteState: ExpenseReportLineDeleteState = { ok: false };
const CUSTOM_TYPE_DEPENSE = "autre";

/**
 * Suppression de Ligne : réservée à l'Admin (deleteAction absent côté
 * Structure, cf. #18), même pattern de confirmation navigateur que
 * RemoveDocumentButton (supporting-documents-panel.tsx).
 */
function DeleteLigneButton({
  deleteAction,
  lineId,
}: {
  deleteAction: (
    state: ExpenseReportLineDeleteState,
    formData: FormData,
  ) => Promise<ExpenseReportLineDeleteState>;
  lineId: string;
}) {
  const [, formAction, pending] = useActionState(
    deleteAction,
    initialDeleteState,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm("Supprimer cette Ligne ?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={lineId} />
      <button
        type="submit"
        className="btn btn-ghost btn-xs text-error"
        disabled={pending}
        aria-label="Supprimer cette Ligne"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}

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
  action,
  deleteAction,
  assoSlug,
  line,
  assoType,
  typeDepenses,
  visibleSubventions,
  editable,
  showBeneficiaryColumn = true,
  showIbanColumn = false,
}: {
  /** Server Action liée (Structure ou Admin, cf. #18) — la ligne ne connaît pas l'acteur qui l'invoque. */
  action: (
    state: ExpenseReportLineFormState,
    formData: FormData,
  ) => Promise<ExpenseReportLineFormState>;
  /** Réservée à l'Admin (#18) : sans elle, pas de bouton de suppression — le Structure ne peut jamais supprimer une Ligne. */
  deleteAction?: (
    state: ExpenseReportLineDeleteState,
    formData: FormData,
  ) => Promise<ExpenseReportLineDeleteState>;
  /** Absent côté Admin : la page Admin n'est pas scopée à une Structure (cf. #18). */
  assoSlug?: string;
  line: ExpenseReportLineDetail;
  assoType: AssoType | null;
  typeDepenses: TypeDepenseOption[];
  visibleSubventions: VisibleSubvention[];
  editable: boolean;
  showBeneficiaryColumn?: boolean;
  /** Colonne IBAN affichée en lecture seule : l'Admin voit l'IBAN sans avoir à ouvrir l'édition (cf. #17), pas la Structure. */
  showIbanColumn?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [fields, setFields] = useState<FieldsState>(() => fieldsFromLine(line));

  // Après chaque soumission, on resynchronise les champs affichés sur le
  // résultat du Server Action plutôt que de laisser le navigateur réinitialiser
  // le <form> : en échec, la saisie de l'utilisateur est restaurée telle
  // quelle (pas besoin de tout retaper) ; en succès, le panneau se referme —
  // sauf s'il y a des Warnings à afficher (cf. T13-T15), auquel cas il reste
  // ouvert le temps que l'utilisateur les lise, fermeture manuelle via
  // "Annuler". Ajusté pendant le rendu (cf. règle react-hooks/set-state-in-effect),
  // pas dans un effet.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.ok && editing) {
      if (!state.warnings || state.warnings.length === 0) {
        setEditing(false);
      }
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

  useSubventionSelectionConsumer({
    active: editing && fields.fundingSource === "SUBVENTION",
    selectedId: fields.subventionId,
    onSelect: (id) => setField("subventionId", id),
  });

  const canUseClubBalance = assoType === "CLUB";
  const selectedSubvention = visibleSubventions.find(
    (s) => s.id === fields.subventionId,
  );
  const sourceDetail = fundingSourceDetail(line);

  const columnCount =
    (showBeneficiaryColumn ? 1 : 0) + (showIbanColumn ? 1 : 0) + 5;

  return (
    <>
      <tr className="hover">
        {showBeneficiaryColumn && (
          <td>
            {line.beneficiaryFirstname} {line.beneficiaryLastname}
          </td>
        )}
        {showIbanColumn && <td>{line.iban ?? "—"}</td>}
        <td>{line.expenseName}</td>
        <td>{line.typeDepenseLabel ?? line.customLabel}</td>
        <td>{formatCents(line.amountCents)}</td>
        <td>
          <div className="flex items-center gap-1.5">
            <span>{sourceDetail}</span>
            {line.warnings.length > 0 && (
              <div
                className="tooltip tooltip-warning"
                data-tip={line.warnings.join(" ")}
              >
                <TriangleAlert
                  className="size-4 shrink-0 text-warning"
                  aria-label={line.warnings.join(" ")}
                />
              </div>
            )}
          </div>
        </td>
        <td>
          {editable && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={toggleEditing}
              >
                {editing ? "Annuler" : "Modifier"}
              </button>
              {deleteAction && (
                <DeleteLigneButton deleteAction={deleteAction} lineId={line.id} />
              )}
            </div>
          )}
        </td>
      </tr>
      {editable && editing && (
        <tr>
          <td colSpan={columnCount}>
            <form action={formAction} className="flex flex-col gap-3 py-2">
              <input type="hidden" name="id" value={line.id} />
              {assoSlug !== undefined && (
                <input type="hidden" name="assoSlug" value={assoSlug} />
              )}

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
                <input
                  type="hidden"
                  name="fundingSource"
                  value={fields.fundingSource}
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(
                    [
                      ...(canUseClubBalance ? (["CLUB_BALANCE"] as const) : []),
                      "SUBVENTION" as const,
                    ] satisfies FundingSourceType[]
                  ).map((source) => {
                    const checked = fields.fundingSource === source;
                    return (
                      <label
                        key={source}
                        className={`card cursor-pointer border-2 p-2 text-center transition-all duration-150 ${
                          checked
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                            : "border-base-300 hover:border-primary/50 hover:bg-base-200/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="fundingSourceChoice"
                          className="sr-only"
                          checked={checked}
                          onChange={() => setField("fundingSource", source)}
                        />
                        <span className="text-xs font-medium">
                          {fundingSourceLabel[source]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {fields.fundingSource === "SUBVENTION" && (
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Subvention</legend>
                  <input
                    type="hidden"
                    name="subventionId"
                    value={fields.subventionId}
                  />
                  {selectedSubvention ? (
                    <p className="text-sm font-medium text-primary">
                      {selectedSubvention.reason}
                    </p>
                  ) : fields.subventionId === line.subventionId &&
                    line.subventionReason ? (
                    // Subvention déjà assignée à cette Ligne mais sortie de la
                    // fenêtre du panneau (plus de deux ans, cf.
                    // isSubventionWithinFundingWindow) : on affiche quand même
                    // sa raison, connue via la Ligne elle-même.
                    <p className="text-sm font-medium text-primary">
                      {line.subventionReason}
                    </p>
                  ) : (
                    <p className="text-sm text-base-content/70">
                      Choisissez une Subvention dans le panneau à droite.
                    </p>
                  )}
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
              {state.ok && state.warnings && state.warnings.length > 0 && (
                <div
                  role="alert"
                  className="alert alert-warning alert-soft alert-sm"
                >
                  <ul className="list-disc pl-4">
                    {state.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="btn btn-primary btn-sm self-start"
                  disabled={
                    pending ||
                    !fields.fundingSource ||
                    (fields.fundingSource === "SUBVENTION" &&
                      !fields.subventionId)
                  }
                >
                  {pending ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    "Enregistrer"
                  )}
                </button>
                {state.ok && state.warnings && state.warnings.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEditing(false)}
                  >
                    Fermer
                  </button>
                )}
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
