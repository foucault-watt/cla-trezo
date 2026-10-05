"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  CircleAlert,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Modal,
  useModalAutoClose,
  type ModalHandle,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { AssoType, FundingSourceType } from "@/app/generated/prisma/enums";
import type { ExpenseReportLineDetail } from "@/lib/expense-reports/expense-report-detail-mapping";
import {
  addReimbursementAction,
  deleteReimbursementAction,
  updateReimbursementAction,
  type ReimbursementFormState,
} from "@/lib/expense-reports/expense-report-actions";
import type { TypeDepenseOption } from "@/lib/expense-reports/expense-reports";
import { fundingSourceLabel } from "@/lib/expense-reports/labels";
import { formatCents } from "@/lib/money";
import { pluralize } from "@/lib/plural";
import type { SoldeView } from "@/lib/solde/solde";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";

const initialFormState: ReimbursementFormState = { ok: false };
const CUSTOM_TYPE = "__custom__";
const dateFormatter = new Intl.DateTimeFormat("fr-FR");

type EditorValues = {
  expenseDate: string;
  expenseName: string;
  amount: string;
  typeChoice: string;
  customLabel: string;
  fundingChoice: string;
};

type ReimbursementAction = typeof addReimbursementAction;

function toDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

function initialValues(line?: ExpenseReportLineDetail): EditorValues {
  return {
    expenseDate: toDateInput(line?.expenseDate ?? null),
    expenseName: line?.expenseName ?? "",
    amount: line ? (line.amountCents / 100).toFixed(2) : "",
    typeChoice: line?.typeDepenseId ?? (line?.customLabel ? CUSTOM_TYPE : ""),
    customLabel: line?.customLabel ?? "",
    fundingChoice:
      line?.fundingSource === "SUBVENTION"
        ? `SUBVENTION:${line.subventionId}`
        : (line?.fundingSource ?? ""),
  };
}

function editorValuesSignature(values: EditorValues) {
  return JSON.stringify(values);
}

function editorValuesAreComplete(values: EditorValues) {
  return Boolean(
    values.expenseDate &&
    values.expenseName.trim() &&
    values.typeChoice &&
    (values.typeChoice !== CUSTOM_TYPE || values.customLabel.trim()) &&
    values.fundingChoice &&
    Number(values.amount) > 0,
  );
}

function FundingSourceSelect({
  formId,
  value,
  onChange,
  assoType,
  visibleSubventions,
  soldeView,
}: {
  formId: string;
  value: string;
  onChange: (value: string) => void;
  assoType: AssoType | null;
  visibleSubventions: VisibleSubvention[];
  soldeView: SoldeView;
}) {
  const freshSubventions = visibleSubventions.filter(
    (subvention) => !subvention.stale,
  );
  const staleSubventions = visibleSubventions.filter(
    (subvention) => subvention.stale,
  );

  return (
    <select
      form={formId}
      className="select select-sm min-w-48 w-full"
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Source de financement"
    >
      <option value="" disabled>
        Choisir
      </option>
      {assoType === "CLUB" && (
        <option value="CLUB_BALANCE">
          {fundingSourceLabel.CLUB_BALANCE}
          {soldeView.status === "ready"
            ? ` · ${formatCents(soldeView.balanceCents)} disponibles`
            : ""}
        </option>
      )}
      {freshSubventions.length > 0 && (
        <optgroup label="Subventions">
          {freshSubventions.map((subvention) => (
            <option key={subvention.id} value={`SUBVENTION:${subvention.id}`}>
              {subvention.campaignName} · {subvention.reason} ·{" "}
              {formatCents(subvention.remainingAmountCents)} restants
            </option>
          ))}
        </optgroup>
      )}
      {staleSubventions.length > 0 && (
        <optgroup label="Subventions de plus d’un an">
          {staleSubventions.map((subvention) => (
            <option key={subvention.id} value={`SUBVENTION:${subvention.id}`}>
              {subvention.campaignName} · {subvention.reason} ·{" "}
              {formatCents(subvention.remainingAmountCents)} restants
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

/**
 * Une ligne reste en permanence éditable : aucun mode « Modifier ». Chaque
 * cellule est un vrai champ ; une saisie complète est enregistrée après un
 * court délai, au changement de ligne ou immédiatement avec Entrée.
 */
function EditableReimbursementRow({
  action,
  assoSlug,
  expenseReportId,
  line,
  assoType,
  typeDepenses,
  visibleSubventions,
  soldeView,
  deleteAction,
  onCreated,
}: {
  action: ReimbursementAction;
  assoSlug: string;
  expenseReportId: string;
  line?: ExpenseReportLineDetail;
  assoType: AssoType | null;
  typeDepenses: TypeDepenseOption[];
  visibleSubventions: VisibleSubvention[];
  soldeView: SoldeView;
  deleteAction: typeof deleteReimbursementAction;
  onCreated?: () => void;
}) {
  const formId = `reimbursement-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const initialFields = initialValues(line);
  const initialSavedSignature = line
    ? editorValuesSignature(initialFields)
    : "";
  const formRef = useRef<HTMLFormElement>(null);
  const latestFieldsRef = useRef(initialFields);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveInFlightRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const lastSavedSignatureRef = useRef(initialSavedSignature);
  const [lastSavedSignature, setLastSavedSignature] = useState(
    initialSavedSignature,
  );
  const [state, formAction, pending] = useActionState(
    async (previousState: ReimbursementFormState, formData: FormData) => {
      const submittedSignature = String(
        formData.get("clientValuesSignature") ?? "",
      );
      const result = await action(previousState, formData);
      saveInFlightRef.current = false;
      if (result.ok) {
        lastSavedSignatureRef.current = submittedSignature;
        setLastSavedSignature(submittedSignature);
        if (!line) {
          onCreated?.();
          return result;
        }
      }
      const latestSignature = editorValuesSignature(latestFieldsRef.current);
      if (
        saveQueuedRef.current ||
        (result.ok && latestSignature !== submittedSignature)
      ) {
        saveQueuedRef.current = false;
        setTimeout(requestSave, 0);
      }
      return result;
    },
    initialFormState,
  );
  const [fields, setFields] = useState(initialFields);
  const deleteModalRef = useRef<ModalHandle>(null);
  const { push: pushToast } = useToast();
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    deleteAction,
    initialFormState,
  );
  useModalAutoClose(deleteModalRef, deleteState.ok);

  useEffect(() => {
    if (!deleteState.ok && deleteState.error) {
      pushToast({ type: "error", message: deleteState.error });
    }
  }, [deleteState, pushToast]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  function requestSave() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const current = latestFieldsRef.current;
    const signature = editorValuesSignature(current);
    if (
      !editorValuesAreComplete(current) ||
      signature === lastSavedSignatureRef.current
    ) {
      return;
    }
    if (saveInFlightRef.current) {
      saveQueuedRef.current = true;
      return;
    }
    submitCurrentForm();
  }

  function submitCurrentForm() {
    const form = formRef.current;
    if (!form) return;
    saveInFlightRef.current = true;
    startTransition(() => formAction(new FormData(form)));
  }

  function updateFields(next: EditorValues) {
    latestFieldsRef.current = next;
    setFields(next);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (editorValuesAreComplete(next)) {
      saveTimerRef.current = setTimeout(requestSave, 650);
    }
  }

  const [fundingSource, subventionId = ""] = fields.fundingChoice.split(
    ":",
  ) as [FundingSourceType | "", string?];
  const currentSignature = editorValuesSignature(fields);
  const complete = editorValuesAreComplete(fields);
  const dirty = currentSignature !== lastSavedSignature;

  return (
    <>
      <tr
        className={
          line
            ? "group"
            : "bg-base-200/60 [&>td:first-child]:shadow-[inset_3px_0_0_var(--color-neutral)]"
        }
        onBlurCapture={(event) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
            requestSave();
          }
        }}
      >
        <td className="min-w-36 align-top">
          <form
            ref={formRef}
            id={formId}
            action={formAction}
            onSubmit={(event) => {
              event.preventDefault();
              if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
              submitCurrentForm();
            }}
          >
            {line ? (
              <input type="hidden" name="id" value={line.id} />
            ) : (
              <input
                type="hidden"
                name="expenseReportId"
                value={expenseReportId}
              />
            )}
            <input type="hidden" name="assoSlug" value={assoSlug} />
            <input type="hidden" name="fundingSource" value={fundingSource} />
            <input type="hidden" name="subventionId" value={subventionId} />
            <input
              type="hidden"
              name="clientValuesSignature"
              value={currentSignature}
            />
            {fields.typeChoice !== CUSTOM_TYPE && (
              <input
                type="hidden"
                name="typeDepenseId"
                value={fields.typeChoice}
              />
            )}
            <DatePicker
              size="sm"
              name="expenseDate"
              value={fields.expenseDate}
              onChange={(expenseDate) =>
                updateFields({ ...latestFieldsRef.current, expenseDate })
              }
            />
          </form>
        </td>
        <td className="min-w-40 align-top">
          <input
            form={formId}
            className="input input-sm w-full"
            name="expenseName"
            required
            autoFocus={!line}
            placeholder="Nouvelle dépense"
            value={fields.expenseName}
            onChange={(event) =>
              updateFields({
                ...latestFieldsRef.current,
                expenseName: event.target.value,
              })
            }
          />
        </td>
        <td className="min-w-36 align-top">
          <select
            form={formId}
            className="select select-sm w-full"
            required
            aria-label="Type de dépense"
            value={fields.typeChoice}
            onChange={(event) =>
              updateFields({
                ...latestFieldsRef.current,
                typeChoice: event.target.value,
              })
            }
          >
            <option value="" disabled>
              Choisir
            </option>
            {typeDepenses.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
            <option value={CUSTOM_TYPE}>Autre (à préciser)</option>
          </select>
          {fields.typeChoice === CUSTOM_TYPE && (
            <input
              form={formId}
              className="input input-sm mt-1 w-full"
              name="customLabel"
              required
              placeholder="Préciser le type"
              value={fields.customLabel}
              onChange={(event) =>
                updateFields({
                  ...latestFieldsRef.current,
                  customLabel: event.target.value,
                })
              }
            />
          )}
        </td>
        <td className="min-w-44 align-top">
          <FundingSourceSelect
            formId={formId}
            value={fields.fundingChoice}
            onChange={(fundingChoice) =>
              updateFields({ ...latestFieldsRef.current, fundingChoice })
            }
            assoType={assoType}
            visibleSubventions={visibleSubventions}
            soldeView={soldeView}
          />
        </td>
        <td className="min-w-28 align-top">
          <label className="input input-sm flex w-full items-center gap-1">
            <input
              form={formId}
              className="min-w-0 grow text-right tabular-nums outline-none"
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              required
              aria-label="Montant en euros"
              value={fields.amount}
              onChange={(event) =>
                updateFields({
                  ...latestFieldsRef.current,
                  amount: event.target.value,
                })
              }
            />
            <span className="text-base-content/50">€</span>
          </label>
        </td>
        <td className="align-top">
          <div className="flex items-center justify-end gap-1">
            {line?.warnings.length ? (
              <div
                className="tooltip tooltip-left"
                data-tip={line.warnings.join(" · ")}
              >
                <span
                  className="badge badge-warning gap-1"
                  aria-label={line.warnings.join(" ")}
                >
                  <TriangleAlert size={12} />
                  {line.warnings.length}
                </span>
              </div>
            ) : null}
            {line ? (
              <button
                type="button"
                className="btn btn-ghost btn-square btn-sm text-error opacity-50 transition-opacity group-hover:opacity-100 focus:opacity-100"
                onClick={() => deleteModalRef.current?.open()}
                aria-label={`Supprimer ${line.expenseName}`}
              >
                <Trash2 size={15} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-square btn-sm"
                onClick={onCreated}
                aria-label="Annuler l’ajout"
              >
                <X size={17} />
              </button>
            )}
            <span className="flex size-8 items-center justify-center">
              {pending ? (
                <span
                  className="loading loading-spinner loading-xs text-info"
                  role="status"
                  aria-label="Enregistrement en cours"
                />
              ) : !state.ok && state.error ? (
                <CircleAlert
                  size={16}
                  className="text-error"
                  role="img"
                  aria-label="Échec de l’enregistrement"
                />
              ) : !complete && dirty ? (
                <TriangleAlert
                  size={16}
                  className="text-warning"
                  role="img"
                  aria-label="Ligne à compléter"
                />
              ) : !dirty && line ? (
                <CheckCircle2
                  size={16}
                  className="text-success"
                  role="img"
                  aria-label="Ligne enregistrée"
                />
              ) : null}
            </span>
          </div>
        </td>
      </tr>
      {!state.ok && state.error && (
        <tr>
          <td colSpan={6} className="pt-0">
            <div role="alert" className="alert alert-error alert-soft py-2">
              {state.error}
            </div>
          </td>
        </tr>
      )}
      {line && (
        <Modal
          ref={deleteModalRef}
          title={`Supprimer la dépense « ${line.expenseName} » ?`}
        >
          <p className="text-sm text-base-content/80">
            Cette action est définitive.
          </p>
          <form action={deleteFormAction} className="modal-action">
            <input type="hidden" name="id" value={line.id} />
            <input type="hidden" name="assoSlug" value={assoSlug} />
            <button
              type="button"
              className="btn"
              onClick={() => deleteModalRef.current?.close()}
            >
              <X size={16} />
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-error"
              disabled={deletePending}
            >
              {deletePending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <Trash2 size={16} />
                  Supprimer
                </>
              )}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

function ReadOnlyReimbursementRow({ line }: { line: ExpenseReportLineDetail }) {
  return (
    <tr>
      <td>{line.expenseDate ? dateFormatter.format(line.expenseDate) : "—"}</td>
      <td className="font-medium">{line.expenseName}</td>
      <td>{line.typeDepenseLabel ?? line.customLabel}</td>
      <td>
        {line.fundingSource === "SUBVENTION"
          ? line.subventionReason
          : fundingSourceLabel[line.fundingSource]}
      </td>
      <td className="text-right">{formatCents(line.amountCents)}</td>
      <td className="text-right">
        {line.warnings.length ? (
          <span
            className="badge badge-warning gap-1"
            aria-label={line.warnings.join(" ")}
          >
            <TriangleAlert size={12} />
            {line.warnings.length}
          </span>
        ) : null}
      </td>
    </tr>
  );
}

export function ReimbursementsTable({
  assoSlug,
  expenseReportId,
  lines,
  assoType,
  typeDepenses,
  visibleSubventions,
  soldeView,
  editable,
  addAction = addReimbursementAction,
  updateAction = updateReimbursementAction,
  deleteAction = deleteReimbursementAction,
}: {
  assoSlug: string;
  expenseReportId: string;
  lines: ExpenseReportLineDetail[];
  assoType: AssoType | null;
  typeDepenses: TypeDepenseOption[];
  visibleSubventions: VisibleSubvention[];
  soldeView: SoldeView;
  editable: boolean;
  addAction?: typeof addReimbursementAction;
  updateAction?: typeof updateReimbursementAction;
  deleteAction?: typeof deleteReimbursementAction;
}) {
  const [adding, setAdding] = useState(false);
  const total = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const warningCount = lines.filter((line) => line.warnings.length > 0).length;

  return (
    <div className="space-y-4">
      {lines.length === 0 && !adding ? (
        <div className="flex flex-col gap-4 rounded-field bg-base-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Aucune dépense pour l&apos;instant</p>
            <p className="mt-1 text-sm text-base-content/70">
              Commencez par ajouter la première dépense de cette Note.
            </p>
          </div>
          {editable && (
            <button
              type="button"
              className="btn btn-primary shrink-0"
              onClick={() => setAdding(true)}
            >
              <Plus size={16} />
              Ajouter une dépense
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
          <table className="table [&_td]:px-2 [&_th]:px-2">
            <thead className="bg-base-200/70">
              <tr>
                <th>Date</th>
                <th>Dépense</th>
                <th>Type</th>
                <th>Financement</th>
                <th className="text-right">Montant</th>
                <th>
                  <span className="sr-only">Alertes et actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) =>
                editable ? (
                  <EditableReimbursementRow
                    key={line.id}
                    action={updateAction}
                    assoSlug={assoSlug}
                    expenseReportId={expenseReportId}
                    line={line}
                    assoType={assoType}
                    typeDepenses={typeDepenses}
                    visibleSubventions={visibleSubventions}
                    soldeView={soldeView}
                    deleteAction={deleteAction}
                  />
                ) : (
                  <ReadOnlyReimbursementRow key={line.id} line={line} />
                ),
              )}
              {editable && adding && (
                <EditableReimbursementRow
                  action={addAction}
                  assoSlug={assoSlug}
                  expenseReportId={expenseReportId}
                  assoType={assoType}
                  typeDepenses={typeDepenses}
                  visibleSubventions={visibleSubventions}
                  soldeView={soldeView}
                  deleteAction={deleteAction}
                  onCreated={() => setAdding(false)}
                />
              )}
              {editable && !adding && (
                <tr>
                  <td colSpan={6} className="p-0">
                    <button
                      type="button"
                      className="btn btn-ghost btn-block justify-start rounded-none text-base-content/70"
                      onClick={() => setAdding(true)}
                    >
                      <Plus size={16} />
                      Ajouter une dépense
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <th className="text-right" colSpan={4}>
                  Total
                </th>
                <th className="text-right">{formatCents(total)}</th>
                <th />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {warningCount > 0 && (
        <div role="status" className="alert alert-warning alert-soft">
          <TriangleAlert size={18} />
          <span>
            {pluralize(warningCount, "dépense comporte", "dépenses comportent")}{" "}
            une alerte. Cela ne bloque pas la soumission.
          </span>
        </div>
      )}
    </div>
  );
}
