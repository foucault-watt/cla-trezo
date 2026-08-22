"use client";

import { useActionState, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Coins,
  HandCoins,
  History,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  Wallet,
  X,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Modal,
  useModalAutoClose,
  type ModalHandle,
} from "@/components/ui/modal";
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

function SubventionOption({
  subvention,
  selected,
  onSelect,
}: {
  subvention: VisibleSubvention;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-box border-2 p-3 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-base-300 hover:border-primary/50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Coins size={14} className="shrink-0" />
          {subvention.campaignName} · {subvention.reason}
        </span>
        {subvention.stale && (
          <span className="badge badge-warning badge-sm shrink-0">
            + d&apos;1 an
          </span>
        )}
      </div>
      <span className="text-xs text-base-content/60">
        {formatCents(subvention.remainingAmountCents)} restants
      </span>
    </button>
  );
}

/**
 * Sélecteur de source de financement (T11) : ouvre une modale plutôt que
 * d'imbriquer 2 gros boutons + une liste de Subventions dans la cellule
 * compacte de la ligne d'édition. Les Subventions de plus d'un an (`stale`,
 * cf. lib/expense-reports/line-warnings.ts) restent sélectionnables mais
 * repliées par défaut derrière "Voir les Subventions plus anciennes" — celles
 * de plus de 2 ans ont déjà disparu de `visibleSubventions` en amont.
 */
function FundingSourceField({
  value,
  onChange,
  assoType,
  visibleSubventions,
  soldeView,
}: {
  value: string;
  onChange: (value: string) => void;
  assoType: AssoType | null;
  visibleSubventions: VisibleSubvention[];
  soldeView: SoldeView;
}) {
  const modalRef = useRef<ModalHandle>(null);
  const [panel, setPanel] = useState<FundingSourceType | null>(null);
  const [showStale, setShowStale] = useState(false);

  const selectedSubvention = value.startsWith("SUBVENTION:")
    ? visibleSubventions.find((s) => s.id === value.slice("SUBVENTION:".length))
    : undefined;

  const label =
    value === "CLUB_BALANCE"
      ? fundingSourceLabel.CLUB_BALANCE
      : selectedSubvention
        ? `${selectedSubvention.campaignName} · ${selectedSubvention.reason}`
        : "Choisir";

  const freshSubventions = visibleSubventions.filter((s) => !s.stale);
  const staleSubventions = visibleSubventions.filter((s) => s.stale);

  function openModal() {
    setPanel(
      value === "CLUB_BALANCE"
        ? null
        : value.startsWith("SUBVENTION:") || assoType !== "CLUB"
          ? "SUBVENTION"
          : null,
    );
    setShowStale(Boolean(selectedSubvention?.stale));
    modalRef.current?.open();
  }

  function selectSubvention(id: string) {
    onChange(`SUBVENTION:${id}`);
    modalRef.current?.close();
  }

  function selectClubBalance() {
    onChange("CLUB_BALANCE");
    modalRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-outline btn-sm w-full justify-between font-normal"
        onClick={openModal}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={14} className="shrink-0 opacity-60" />
      </button>
      <Modal ref={modalRef} title="Source de financement">
        <div className="flex flex-col gap-4">
          {assoType === "CLUB" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={selectClubBalance}
                className={`card cursor-pointer border-2 p-4 text-left ${
                  value === "CLUB_BALANCE"
                    ? "border-primary bg-primary/5"
                    : "border-base-300 hover:border-primary/50"
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Wallet size={16} />
                  {fundingSourceLabel.CLUB_BALANCE}
                </span>
                {soldeView.status === "ready" && (
                  <span className="block text-xs text-base-content/60">
                    {formatCents(soldeView.balanceCents)} disponibles
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPanel("SUBVENTION")}
                className={`card cursor-pointer border-2 p-4 text-left ${
                  panel === "SUBVENTION"
                    ? "border-primary bg-primary/5"
                    : "border-base-300 hover:border-primary/50"
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <HandCoins size={16} />
                  Subvention
                </span>
              </button>
            </div>
          )}

          {panel === "SUBVENTION" && (
            <div className="flex flex-col gap-2">
              {freshSubventions.length === 0 &&
                staleSubventions.length === 0 && (
                  <p className="text-sm text-base-content/70">
                    Aucune Subvention disponible.
                  </p>
                )}
              {(showStale
                ? [...freshSubventions, ...staleSubventions]
                : freshSubventions
              ).map((subvention) => (
                <SubventionOption
                  key={subvention.id}
                  subvention={subvention}
                  selected={value === `SUBVENTION:${subvention.id}`}
                  onSelect={() => selectSubvention(subvention.id)}
                />
              ))}
              {staleSubventions.length > 0 && !showStale && (
                <button
                  type="button"
                  className="link link-hover inline-flex items-center gap-1 self-start text-xs text-base-content/50 italic"
                  onClick={() => setShowStale(true)}
                >
                  <History size={13} />
                  Voir {staleSubventions.length} Subvention
                  {staleSubventions.length > 1 ? "s" : ""} de plus d&apos;un an
                </button>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

function ReimbursementEditor({
  action,
  assoSlug,
  expenseReportId,
  line,
  assoType,
  typeDepenses,
  visibleSubventions,
  soldeView,
  onClose,
}: {
  action: typeof addReimbursementAction;
  assoSlug: string;
  expenseReportId: string;
  line?: ExpenseReportLineDetail;
  assoType: AssoType | null;
  typeDepenses: TypeDepenseOption[];
  visibleSubventions: VisibleSubvention[];
  soldeView: SoldeView;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [fields, setFields] = useState(() => initialValues(line));
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.ok) onClose();
  }

  const [fundingSource, subventionId = ""] = fields.fundingChoice.split(
    ":",
  ) as [FundingSourceType | "", string?];

  return (
    <form
      action={formAction}
      className="grid gap-3 py-2 md:grid-cols-2 xl:grid-cols-[9rem_1fr_12rem_1fr_9rem_auto] xl:items-end"
    >
      {line ? (
        <input type="hidden" name="id" value={line.id} />
      ) : (
        <input type="hidden" name="expenseReportId" value={expenseReportId} />
      )}
      <input type="hidden" name="assoSlug" value={assoSlug} />
      <input type="hidden" name="fundingSource" value={fundingSource} />
      <input type="hidden" name="subventionId" value={subventionId} />
      {fields.typeChoice !== CUSTOM_TYPE && (
        <input type="hidden" name="typeDepenseId" value={fields.typeChoice} />
      )}

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Date</legend>
        <DatePicker
          size="sm"
          name="expenseDate"
          value={fields.expenseDate}
          onChange={(expenseDate) => setFields({ ...fields, expenseDate })}
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Dépense</legend>
        <input
          className="input input-sm w-full"
          name="expenseName"
          required
          placeholder="Taxi gare Lille Flandres"
          value={fields.expenseName}
          onChange={(event) =>
            setFields({ ...fields, expenseName: event.target.value })
          }
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Type</legend>
        <select
          className="select select-sm w-full"
          required
          value={fields.typeChoice}
          onChange={(event) =>
            setFields({ ...fields, typeChoice: event.target.value })
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
          <option value={CUSTOM_TYPE}>Autre</option>
        </select>
        {fields.typeChoice === CUSTOM_TYPE && (
          <input
            className="input input-sm mt-1 w-full"
            name="customLabel"
            required
            placeholder="Préciser"
            value={fields.customLabel}
            onChange={(event) =>
              setFields({ ...fields, customLabel: event.target.value })
            }
          />
        )}
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Financement</legend>
        <FundingSourceField
          value={fields.fundingChoice}
          onChange={(value) => setFields({ ...fields, fundingChoice: value })}
          assoType={assoType}
          visibleSubventions={visibleSubventions}
          soldeView={soldeView}
        />
      </fieldset>
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Montant (€)</legend>
        <input
          className="input input-sm w-full"
          type="number"
          name="amount"
          min="0.01"
          step="0.01"
          required
          value={fields.amount}
          onChange={(event) =>
            setFields({ ...fields, amount: event.target.value })
          }
        />
      </fieldset>
      <div className="flex gap-1 pb-1">
        <button
          type="submit"
          className="btn btn-ghost btn-square btn-sm text-success"
          disabled={pending || !fields.fundingChoice || !fields.expenseDate}
          aria-label="Enregistrer le Remboursement"
        >
          {pending ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <Check size={17} />
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-square btn-sm"
          onClick={onClose}
          aria-label="Annuler"
        >
          <X size={17} />
        </button>
      </div>
      {!state.ok && state.error && (
        <div
          role="alert"
          className="alert alert-error alert-soft alert-sm md:col-span-2 xl:col-span-6"
        >
          {state.error}
        </div>
      )}
    </form>
  );
}

function ReimbursementCells({ line }: { line: ExpenseReportLineDetail }) {
  return (
    <>
      <td className="flex justify-between gap-4 md:table-cell">
        <span className="font-medium md:hidden">Date</span>
        {line.expenseDate ? dateFormatter.format(line.expenseDate) : "—"}
      </td>
      <td className="flex justify-between gap-4 md:table-cell">
        <span className="font-medium md:hidden">Dépense</span>
        <span className="text-right md:text-left">{line.expenseName}</span>
      </td>
      <td className="flex justify-between gap-4 md:table-cell">
        <span className="font-medium md:hidden">Type</span>
        {line.typeDepenseLabel ?? line.customLabel}
      </td>
      <td className="flex justify-between gap-4 md:table-cell">
        <span className="font-medium md:hidden">Financement</span>
        <span className="text-right">
          {line.fundingSource === "SUBVENTION"
            ? line.subventionReason
            : fundingSourceLabel[line.fundingSource]}
        </span>
      </td>
      <td className="flex justify-between gap-4 md:table-cell md:text-right">
        <span className="font-medium md:hidden">Montant</span>
        {formatCents(line.amountCents)}
      </td>
      <td className="flex justify-between gap-4 md:table-cell">
        <span className="font-medium md:hidden">Alertes</span>
        {line.warnings.length ? (
          <div
            className="tooltip tooltip-left md:tooltip-top"
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
        ) : (
          "—"
        )}
      </td>
    </>
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
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const total = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const warningCount = lines.filter((line) => line.warnings.length > 0).length;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto md:rounded-box md:border md:border-base-300">
        <table className="table block md:table">
          <thead className="hidden md:table-header-group">
            <tr>
              <th>Date</th>
              <th>Dépense</th>
              <th>Type</th>
              <th>Financement</th>
              <th className="text-right">Montant</th>
              <th>Alertes</th>
              <th />
            </tr>
          </thead>
          <tbody className="block space-y-3 md:table-row-group md:space-y-0">
            {lines.length === 0 && editingId !== "new" && (
              <tr className="block md:table-row">
                <td
                  colSpan={7}
                  className="block text-base-content/60 md:table-cell"
                >
                  Aucun Remboursement pour l&apos;instant.
                </td>
              </tr>
            )}
            {lines.map((line) => (
              <ReimbursementRow
                key={line.id}
                line={line}
                editing={editingId === line.id}
                setEditing={(editing) => setEditingId(editing ? line.id : null)}
                assoSlug={assoSlug}
                expenseReportId={expenseReportId}
                assoType={assoType}
                typeDepenses={typeDepenses}
                visibleSubventions={visibleSubventions}
                soldeView={soldeView}
                editable={
                  editable && (editingId === null || editingId === line.id)
                }
                updateAction={updateAction}
                deleteAction={deleteAction}
              />
            ))}
            {editingId === "new" && (
              <tr className="block rounded-box border border-primary/30 bg-primary/5 md:table-row">
                <td colSpan={7} className="block md:table-cell">
                  <ReimbursementEditor
                    action={addAction}
                    assoSlug={assoSlug}
                    expenseReportId={expenseReportId}
                    assoType={assoType}
                    typeDepenses={typeDepenses}
                    visibleSubventions={visibleSubventions}
                    soldeView={soldeView}
                    onClose={() => setEditingId(null)}
                  />
                </td>
              </tr>
            )}
            {editable && editingId === null && (
              <tr className="block md:table-row">
                <td colSpan={7} className="block p-0 md:table-cell">
                  <button
                    type="button"
                    className="btn btn-ghost btn-block justify-start rounded-none text-base-content/70"
                    onClick={() => setEditingId("new")}
                  >
                    <Plus size={16} />
                    Nouveau Remboursement
                  </button>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="block md:table-footer-group">
            <tr className="flex justify-between md:table-row">
              <th className="md:text-right" colSpan={4}>
                Total
              </th>
              <th className="text-right">{formatCents(total)}</th>
              <th colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
      {warningCount > 0 && (
        <div role="status" className="alert alert-warning alert-soft">
          <TriangleAlert size={18} />
          <span>
            {warningCount} remboursement(s) comportent une alerte. Cela ne
            bloque pas la soumission.
          </span>
        </div>
      )}
    </div>
  );
}

function ReimbursementRow(props: {
  line: ExpenseReportLineDetail;
  editing: boolean;
  setEditing: (editing: boolean) => void;
  assoSlug: string;
  expenseReportId: string;
  assoType: AssoType | null;
  typeDepenses: TypeDepenseOption[];
  visibleSubventions: VisibleSubvention[];
  soldeView: SoldeView;
  editable: boolean;
  updateAction: typeof updateReimbursementAction;
  deleteAction: typeof deleteReimbursementAction;
}) {
  const deleteModalRef = useRef<ModalHandle>(null);
  const [deleteState, deleteFormAction, deletePending] = useActionState(
    props.deleteAction,
    { ok: false },
  );
  useModalAutoClose(deleteModalRef, deleteState.ok);

  return (
    <>
      <tr className="block rounded-box border border-base-300 bg-base-100 md:table-row md:rounded-none md:border-0">
        <ReimbursementCells line={props.line} />
        <td className="flex justify-end gap-1 md:table-cell">
          <button
            type="button"
            className="btn btn-ghost btn-square btn-xs"
            disabled={!props.editable}
            onClick={() => props.setEditing(!props.editing)}
            aria-label="Modifier"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-square btn-xs text-error"
            disabled={!props.editable}
            onClick={() => deleteModalRef.current?.open()}
            aria-label="Supprimer"
          >
            <Trash2 size={15} />
          </button>
          <Modal
            ref={deleteModalRef}
            title={`Supprimer le remboursement « ${props.line.expenseName} » ?`}
          >
            <p className="text-sm text-base-content/80">
              Cette action est définitive.
            </p>
            {!deleteState.ok && deleteState.error && (
              <div role="alert" className="alert alert-error alert-soft mt-4">
                {deleteState.error}
              </div>
            )}
            <form action={deleteFormAction} className="modal-action">
              <input type="hidden" name="id" value={props.line.id} />
              <input type="hidden" name="assoSlug" value={props.assoSlug} />
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
        </td>
      </tr>
      {props.editing && (
        <tr className="block rounded-box border border-primary/30 bg-primary/5 md:table-row">
          <td colSpan={7} className="block md:table-cell">
            <ReimbursementEditor
              action={props.updateAction}
              assoSlug={props.assoSlug}
              expenseReportId={props.expenseReportId}
              line={props.line}
              assoType={props.assoType}
              typeDepenses={props.typeDepenses}
              visibleSubventions={props.visibleSubventions}
              soldeView={props.soldeView}
              onClose={() => props.setEditing(false)}
            />
          </td>
        </tr>
      )}
    </>
  );
}
