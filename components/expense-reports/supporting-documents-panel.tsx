"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  FileText,
  Receipt,
  ScrollText,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  Modal,
  useModalAutoClose,
  type ModalHandle,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type {
  AddSupportingDocumentsState,
  RemoveSupportingDocumentState,
} from "@/lib/expense-reports/supporting-document-shared";
import type { SupportingDocumentDetail } from "@/lib/expense-reports/expense-reports";
import type { SupportingDocumentType } from "@/app/generated/prisma/enums";

type AddSupportingDocumentsAction = (
  prevState: AddSupportingDocumentsState,
  formData: FormData,
) => Promise<AddSupportingDocumentsState>;

type RemoveSupportingDocumentAction = (
  prevState: RemoveSupportingDocumentState,
  formData: FormData,
) => Promise<RemoveSupportingDocumentState>;

const initialAddState: AddSupportingDocumentsState = { ok: false };
const initialRemoveState: RemoveSupportingDocumentState = { ok: false };

const ACCEPTED_FILE_TYPES = "application/pdf,image/jpeg,image/png,image/webp";

const dropZoneCopy: Record<SupportingDocumentType, string> = {
  RECEIPT: "Déposez vos factures ici, ou cliquez pour parcourir",
  HONOR_STATEMENT: "Déposez votre attestation ici, ou cliquez pour parcourir",
};

const documentTypeLabel: Record<SupportingDocumentType, string> = {
  RECEIPT: "Facture",
  HONOR_STATEMENT: "Attestation sur l'honneur",
};

function RemoveDocumentButton({
  assoSlug,
  documentId,
  filename,
  removeAction,
}: {
  assoSlug?: string;
  documentId: string;
  filename: string;
  removeAction: RemoveSupportingDocumentAction;
}) {
  const modalRef = useRef<ModalHandle>(null);
  const { push: pushToast } = useToast();
  const [state, formAction, pending] = useActionState(
    removeAction,
    initialRemoveState,
  );
  useModalAutoClose(modalRef, state.ok);

  useEffect(() => {
    if (!state.ok && state.error) {
      pushToast({ type: "error", message: state.error });
    }
  }, [state, pushToast]);

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-xs text-error"
        onClick={() => modalRef.current?.open()}
        aria-label="Supprimer ce Justificatif"
      >
        <Trash2 className="size-4" />
      </button>
      <Modal ref={modalRef} title="Supprimer ce justificatif ?">
        <p className="text-sm text-base-content/80">
          Le fichier « <span className="font-medium">{filename}</span> » sera
          définitivement supprimé.
        </p>
        <form action={formAction}>
          <input type="hidden" name="id" value={documentId} />
          {assoSlug && <input type="hidden" name="assoSlug" value={assoSlug} />}
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={() => modalRef.current?.close()}
            >
              <X size={16} />
              Annuler
            </button>
            <button type="submit" className="btn btn-error" disabled={pending}>
              {pending ? (
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

function DocumentRow({
  assoSlug,
  basePath,
  document,
  editable,
  removeAction,
}: {
  assoSlug?: string;
  basePath: string;
  document: SupportingDocumentDetail;
  editable: boolean;
  removeAction: RemoveSupportingDocumentAction;
}) {
  const isImage = document.mimeType.startsWith("image/");
  const url = `${basePath}/justificatifs/${document.id}`;

  return (
    <li className="flex items-center gap-3 rounded-box border border-base-300 p-2">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex flex-1 items-center gap-3 overflow-hidden"
      >
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- fichier servi dynamiquement par un Route Handler, pas un asset next/image.
          <img src={url} alt="" className="h-12 w-12 rounded object-cover" />
        ) : (
          <FileText className="size-8 shrink-0 text-base-content/60" />
        )}
        <span className="truncate text-sm">{document.originalFilename}</span>
      </a>
      {editable && (
        <RemoveDocumentButton
          assoSlug={assoSlug}
          documentId={document.id}
          filename={document.originalFilename}
          removeAction={removeAction}
        />
      )}
    </li>
  );
}

/**
 * Zone cliquable + glisser-déposer qui alimente un <input type="file"> caché
 * visuellement (`sr-only`, pas `hidden`) : ce dernier reste dans le flux
 * d'accessibilité, contrairement à `display:none`.
 */
function FileDropZone({
  multiple,
  pending,
  label,
}: {
  multiple: boolean;
  pending: boolean;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);

  // Aucun bouton "Ajouter" : dès qu'un fichier est déposé ou sélectionné, on
  // soumet le formulaire automatiquement via requestSubmit().
  function applyFiles(files: FileList | null) {
    if (!files || files.length === 0 || !inputRef.current) return;
    inputRef.current.files = files;
    setFileNames(Array.from(files).map((file) => file.name));
    inputRef.current.form?.requestSubmit();
  }

  return (
    <div
      role="button"
      tabIndex={pending ? -1 : 0}
      aria-disabled={pending}
      onClick={() => {
        if (!pending) inputRef.current?.click();
      }}
      onKeyDown={(event) => {
        if (pending) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!pending) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragOver(false);
        if (!pending) applyFiles(event.dataTransfer.files);
      }}
      className={`flex flex-col items-center gap-3 rounded-box border-2 border-dashed p-10 text-center transition-colors ${
        pending
          ? "cursor-wait border-base-300 opacity-60"
          : isDragOver
            ? "cursor-pointer border-primary bg-primary/5"
            : "cursor-pointer border-base-300 hover:border-primary/50"
      }`}
    >
      {pending ? (
        <span className="loading loading-spinner loading-lg text-primary" />
      ) : (
        <UploadCloud className="size-9 text-base-content/50" />
      )}
      {fileNames.length > 0 ? (
        <ul className="text-sm">
          {fileNames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-base-content/70">
          {label}
          <br />
          <span className="text-xs">
            PDF, JPEG, PNG ou WEBP — 10 Mo max par fichier — envoi automatique
          </span>
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        name="files"
        multiple={multiple}
        accept={ACCEPTED_FILE_TYPES}
        disabled={pending}
        className="sr-only"
        onChange={(event) => applyFiles(event.target.files)}
      />
    </div>
  );
}

function UploadForm({
  assoSlug,
  reportId,
  documentType,
  multiple,
  addAction,
}: {
  assoSlug?: string;
  reportId: string;
  documentType: SupportingDocumentType;
  multiple: boolean;
  addAction: AddSupportingDocumentsAction;
}) {
  const { push: pushToast } = useToast();
  const [state, formAction, pending] = useActionState(
    addAction,
    initialAddState,
  );

  // La zone de dépôt est remontée (changement de `key`) après un envoi
  // réussi pour vider sa sélection, plutôt que dans un effet (cf. règle
  // react-hooks/set-state-in-effect).
  const [dropZoneKey, setDropZoneKey] = useState(0);
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.ok) {
      setDropZoneKey((key) => key + 1);
    }
  }

  useEffect(() => {
    if (!state.ok && state.error) {
      pushToast({ type: "error", message: state.error });
    }
  }, [state, pushToast]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="expenseReportId" value={reportId} />
      {assoSlug && <input type="hidden" name="assoSlug" value={assoSlug} />}
      <input type="hidden" name="documentType" value={documentType} />

      <FileDropZone
        key={dropZoneKey}
        multiple={multiple}
        pending={pending}
        label={dropZoneCopy[documentType]}
      />
    </form>
  );
}

export function SupportingDocumentsPanel({
  assoSlug,
  reportId,
  basePath,
  documents,
  editable,
  addAction,
  removeAction,
}: {
  assoSlug?: string;
  reportId: string;
  /** Ex. `/app/club-info/notes-de-frais/report-1` ou `/app/admin/notes-de-frais/report-1`. */
  basePath: string;
  documents: SupportingDocumentDetail[];
  editable: boolean;
  addAction: AddSupportingDocumentsAction;
  removeAction: RemoveSupportingDocumentAction;
}) {
  const receipts = documents.filter((doc) => doc.type === "RECEIPT");
  const honorStatements = documents.filter(
    (doc) => doc.type === "HONOR_STATEMENT",
  );
  // Type déjà engagé sur cette Note : on ne peut plus basculer vers l'autre
  // type tant que ces documents n'ont pas été supprimés (règle d'exclusivité,
  // appliquée côté serveur — ceci n'en est que le reflet visuel).
  const lockedType: SupportingDocumentType | null =
    receipts.length > 0
      ? "RECEIPT"
      : honorStatements.length > 0
        ? "HONOR_STATEMENT"
        : null;

  const [chosenType, setChosenType] =
    useState<SupportingDocumentType>("RECEIPT");
  // Le toggle Facture / Attestation ne s'affiche qu'une fois que la personne
  // a explicitement quitté le choix par défaut (Facture) via la modale
  // d'avertissement — pas dès l'arrivée sur la page.
  const [showTypeToggle, setShowTypeToggle] = useState(false);
  const [lastLockedType, setLastLockedType] = useState(lockedType);
  if (lockedType !== lastLockedType) {
    setLastLockedType(lockedType);
    if (lockedType) {
      setChosenType(lockedType);
    }
  }
  const activeType = lockedType ?? chosenType;

  const honorStatementModalRef = useRef<ModalHandle>(null);

  return (
    <div className="flex flex-col gap-4">
      {editable && (
        <div className="flex flex-col gap-3">
          {lockedType === null && showTypeToggle && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(documentTypeLabel) as SupportingDocumentType[]).map(
                (type) => (
                  <label
                    key={type}
                    className={`card cursor-pointer border-2 p-4 ${
                      chosenType === type
                        ? "border-primary bg-primary/5"
                        : "border-base-300"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        className="radio radio-primary"
                        type="radio"
                        checked={chosenType === type}
                        onChange={() => setChosenType(type)}
                      />
                      {type === "RECEIPT" ? (
                        <Receipt size={16} />
                      ) : (
                        <ScrollText size={16} />
                      )}
                      {documentTypeLabel[type]}
                    </span>
                  </label>
                ),
              )}
            </div>
          )}

          <UploadForm
            key={activeType}
            assoSlug={assoSlug}
            reportId={reportId}
            documentType={activeType}
            multiple={activeType === "RECEIPT"}
            addAction={addAction}
          />
          {lockedType === null && !showTypeToggle && (
            <button
              type="button"
              className="link link-hover inline-flex items-center gap-1 self-start text-xs text-base-content/50 italic"
              onClick={() => honorStatementModalRef.current?.open()}
            >
              <ScrollText size={13} />
              Je n&apos;ai pas de facture
            </button>
          )}
        </div>
      )}

      {documents.length === 0 && !editable && (
        <p className="text-sm text-base-content/70">
          Aucun Justificatif pour l&apos;instant.
        </p>
      )}

      {documents.length > 0 && (
        <ul className="flex flex-col gap-2">
          {[...receipts, ...honorStatements].map((doc) => (
            <DocumentRow
              key={doc.id}
              assoSlug={assoSlug}
              basePath={basePath}
              document={doc}
              editable={editable}
              removeAction={removeAction}
            />
          ))}
        </ul>
      )}

      <Modal ref={honorStatementModalRef} title="Attestation sur l'honneur">
        <p className="text-sm text-base-content/80">
          L&apos;attestation sur l&apos;honneur ne doit être utilisée qu&apos;en
          dernier recours, si vous n&apos;avez vraiment aucune facture ni ticket
          de caisse pour justifier cette dépense.
        </p>
        <div className="modal-action">
          <button
            type="button"
            className="btn"
            onClick={() => honorStatementModalRef.current?.close()}
          >
            <X size={16} />
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setChosenType("HONOR_STATEMENT");
              setShowTypeToggle(true);
              honorStatementModalRef.current?.close();
            }}
          >
            <ScrollText size={16} />
            Je n&apos;ai pas de facture
          </button>
        </div>
      </Modal>
    </div>
  );
}
