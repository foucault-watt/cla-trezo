"use client";

import { useRef, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import {
  deleteTypeDepenseAction,
  updateTypeDepenseAction,
} from "@/lib/admin/type-depense-actions";
import type { TypeDepenseAdminRow } from "@/lib/admin/type-depenses";
import { Modal, useModalAutoClose, type ModalHandle } from "@/components/ui/modal";
import { pluralize } from "@/lib/plural";
import { useTypeDepenseAction } from "./use-type-depense-action";

export function TypeDepenseRow({
  type,
  replacementOptions,
}: {
  type: TypeDepenseAdminRow;
  replacementOptions: { id: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useTypeDepenseAction(
    updateTypeDepenseAction,
  );
  const [deleteState, deleteFormAction, deletePending] = useTypeDepenseAction(
    deleteTypeDepenseAction,
  );
  const deleteModalRef = useRef<ModalHandle>(null);
  useModalAutoClose(deleteModalRef, deleteState.ok);

  // Referme l'édition dès que le renommage réussit, sans setState dans un
  // effet (cf. subvention-row.tsx).
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.ok && editing) {
      setEditing(false);
    }
  }

  const isUsed = type.reimbursementCount > 0;
  const cannotDelete = isUsed && replacementOptions.length === 0;

  return (
    <>
      <tr className="hover">
        <td className="font-medium">{type.label}</td>
        <td className="text-sm text-base-content/70">
          {isUsed
            ? pluralize(type.reimbursementCount, "Remboursement")
            : "Inutilisé"}
        </td>
        <td>
          <div className="flex justify-end gap-1">
            <button
              type="button"
              className="btn btn-ghost btn-square btn-xs"
              aria-label="Renommer le Type de dépense"
              onClick={() => setEditing((value) => !value)}
            >
              {editing ? <X size={15} /> : <Pencil size={15} />}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-square btn-xs text-error"
              aria-label="Supprimer le Type de dépense"
              onClick={() => deleteModalRef.current?.open()}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </td>
      </tr>
      {editing && (
        <tr>
          <td colSpan={3}>
            <form
              action={formAction}
              className="flex flex-col gap-2 py-2 sm:flex-row sm:items-end"
            >
              <input type="hidden" name="id" value={type.id} />

              <fieldset className="fieldset flex-1">
                <legend className="fieldset-legend">Nouveau libellé</legend>
                <input
                  type="text"
                  name="label"
                  defaultValue={type.label}
                  className="input input-sm w-full"
                  maxLength={100}
                  autoFocus
                  required
                />
              </fieldset>

              {!state.ok && state.error && (
                <div role="alert" className="alert alert-error alert-soft alert-sm">
                  <span>{state.error}</span>
                </div>
              )}

              <div className="flex gap-1">
                <button
                  type="submit"
                  className="btn btn-ghost btn-square btn-sm text-success"
                  aria-label="Enregistrer les modifications"
                  disabled={pending}
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
                  aria-label="Annuler la modification"
                  onClick={() => setEditing(false)}
                >
                  <X size={17} />
                </button>
              </div>
            </form>
          </td>
        </tr>
      )}
      <Modal
        ref={deleteModalRef}
        title={`Supprimer le Type « ${type.label} » ?`}
      >
        <form action={deleteFormAction}>
          <input type="hidden" name="id" value={type.id} />
          {!isUsed ? (
            <p className="text-sm text-base-content/80">
              Ce Type n&apos;est utilisé par aucun Remboursement. Il ne sera
              plus proposé aux Structures.
            </p>
          ) : cannotDelete ? (
            <p className="text-sm text-base-content/80">
              Ce Type est utilisé par{" "}
              {pluralize(type.reimbursementCount, "Remboursement")} et
              c&apos;est le seul Type existant : ajoutez d&apos;abord un autre
              Type pour y rattacher ces Remboursements.
            </p>
          ) : (
            <>
              <p className="text-sm text-base-content/80">
                Ce Type est utilisé par{" "}
                {pluralize(type.reimbursementCount, "Remboursement")}, y
                compris dans des Notes de frais déjà validées. Choisissez le
                Type auquel les rattacher.
              </p>
              <fieldset className="fieldset mt-3">
                <legend className="fieldset-legend">Remplacer par</legend>
                <select
                  name="replacementTypeDepenseId"
                  className="select w-full"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    Choisir un Type
                  </option>
                  {replacementOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </fieldset>
            </>
          )}
          {!deleteState.ok && deleteState.error && (
            <div role="alert" className="alert alert-error alert-soft mt-4">
              <span>{deleteState.error}</span>
            </div>
          )}
          <div className="modal-action">
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
              disabled={deletePending || cannotDelete}
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
          </div>
        </form>
      </Modal>
    </>
  );
}
