"use client";

import { useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { reclassCustomLabelAction } from "@/lib/admin/type-depense-actions";
import type { CustomLabelUsage } from "@/lib/admin/type-depense-labels";
import { Modal, useModalAutoClose, type ModalHandle } from "@/components/ui/modal";
import { pluralize } from "@/lib/plural";
import { useTypeDepenseAction } from "./use-type-depense-action";

type Mode = "TYPE" | "RENAME";

export function CustomLabelRow({
  customLabel,
  types,
}: {
  customLabel: CustomLabelUsage;
  types: { id: string; label: string }[];
}) {
  const modalRef = useRef<ModalHandle>(null);
  const [state, formAction, pending] = useTypeDepenseAction(
    reclassCustomLabelAction,
  );
  useModalAutoClose(modalRef, state.ok);

  // Un Type équivalent existe déjà : l'imposer est presque toujours le bon
  // choix, on le propose d'emblée. Sans Type, renommer reste possible.
  const [mode, setMode] = useState<Mode>(
    customLabel.matchingType || types.length > 0 ? "TYPE" : "RENAME",
  );

  return (
    <>
      <tr className="hover">
        <td>
          <span className="font-medium">{customLabel.label}</span>
          {customLabel.matchingType && (
            <p className="text-xs text-base-content/60">
              Équivaut au Type « {customLabel.matchingType.label} »
            </p>
          )}
        </td>
        <td className="text-sm text-base-content/70">
          {pluralize(customLabel.reimbursementCount, "Remboursement")}
          <span className="block text-xs">
            {pluralize(customLabel.expenseReportCount, "Note")} de frais
          </span>
        </td>
        <td className="text-sm">{customLabel.assoNames.join(", ")}</td>
        <td>
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => modalRef.current?.open()}
            >
              <Pencil size={15} />
              Modifier
            </button>
          </div>
        </td>
      </tr>
      <Modal
        ref={modalRef}
        title={`Modifier le libellé « ${customLabel.label} »`}
      >
        <form action={formAction}>
          <input type="hidden" name="customLabel" value={customLabel.label} />
          <input type="hidden" name="mode" value={mode} />
          <p className="text-sm text-base-content/80">
            Concerne{" "}
            {pluralize(customLabel.reimbursementCount, "Remboursement")}, y
            compris dans des Notes de frais déjà validées.
          </p>

          <div role="tablist" className="tabs tabs-box mt-4 w-fit">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "TYPE"}
              className={`tab ${mode === "TYPE" ? "tab-active" : ""}`}
              disabled={types.length === 0}
              onClick={() => setMode("TYPE")}
            >
              Imposer un Type existant
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "RENAME"}
              className={`tab ${mode === "RENAME" ? "tab-active" : ""}`}
              onClick={() => setMode("RENAME")}
            >
              Renommer
            </button>
          </div>

          {mode === "TYPE" ? (
            <fieldset className="fieldset mt-3">
              <legend className="fieldset-legend">Type de dépense</legend>
              <select
                name="typeDepenseId"
                className="select w-full"
                defaultValue={customLabel.matchingType?.id ?? ""}
                required
              >
                <option value="" disabled>
                  Choisir un Type
                </option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="label">
                Le libellé personnalisé disparaît au profit de ce Type.
              </p>
            </fieldset>
          ) : (
            <fieldset className="fieldset mt-3">
              <legend className="fieldset-legend">Nouveau libellé</legend>
              <input
                type="text"
                name="newLabel"
                defaultValue={customLabel.label}
                className="input w-full"
                maxLength={100}
                required
              />
              <p className="label whitespace-normal">
                Reste un libellé personnalisé. S&apos;il correspond à un Type
                existant, les Remboursements y sont directement rattachés.
              </p>
            </fieldset>
          )}

          {!state.ok && state.error && (
            <div role="alert" className="alert alert-error alert-soft mt-4">
              <span>{state.error}</span>
            </div>
          )}
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={() => modalRef.current?.close()}
            >
              <X size={16} />
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <Check size={16} />
                  Appliquer
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
