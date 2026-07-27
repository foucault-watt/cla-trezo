"use client";

import { useActionState, useRef, useState } from "react";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import {
  addSupportingDocumentsAction,
  removeSupportingDocumentAction,
  type AddSupportingDocumentsState,
  type RemoveSupportingDocumentState,
} from "@/lib/expense-reports/supporting-document-actions";
import type { SupportingDocumentDetail } from "@/lib/expense-reports/expense-reports";
import type { SupportingDocumentType } from "@/app/generated/prisma/enums";

const initialAddState: AddSupportingDocumentsState = { ok: false };
const initialRemoveState: RemoveSupportingDocumentState = { ok: false };

const ACCEPTED_FILE_TYPES = "application/pdf,image/jpeg,image/png,image/webp";

const documentTypeCopy: Record<
  SupportingDocumentType,
  { title: string; description: string }
> = {
  RECEIPT: {
    title: "Facture",
    description:
      "Facture, ticket de caisse ou tout document prouvant la dépense. Plusieurs fichiers possibles.",
  },
  HONOR_STATEMENT: {
    title: "Attestation sur l'honneur",
    description: "À utiliser uniquement si vous n'avez pas de Facture.",
  },
};

function documentUrl(assoSlug: string, reportId: string, documentId: string) {
  return `/app/${assoSlug}/notes-de-frais/${reportId}/justificatifs/${documentId}`;
}

function RemoveDocumentButton({
  assoSlug,
  documentId,
}: {
  assoSlug: string;
  documentId: string;
}) {
  const [, formAction, pending] = useActionState(
    removeSupportingDocumentAction,
    initialRemoveState,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!confirm("Supprimer ce fichier ?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={documentId} />
      <input type="hidden" name="assoSlug" value={assoSlug} />
      <button
        type="submit"
        className="btn btn-ghost btn-xs text-error"
        disabled={pending}
        aria-label="Supprimer ce Justificatif"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}

function DocumentRow({
  assoSlug,
  reportId,
  document,
  editable,
}: {
  assoSlug: string;
  reportId: string;
  document: SupportingDocumentDetail;
  editable: boolean;
}) {
  const isImage = document.mimeType.startsWith("image/");
  const url = documentUrl(assoSlug, reportId, document.id);

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
        <RemoveDocumentButton assoSlug={assoSlug} documentId={document.id} />
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
}: {
  multiple: boolean;
  pending: boolean;
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
      className={`flex flex-col items-center gap-2 rounded-box border-2 border-dashed p-6 text-center transition-colors ${
        pending
          ? "cursor-wait border-base-300 opacity-60"
          : isDragOver
            ? "cursor-pointer border-primary bg-primary/5"
            : "cursor-pointer border-base-300 hover:border-primary/50"
      }`}
    >
      {pending ? (
        <span className="loading loading-spinner loading-md text-primary" />
      ) : (
        <UploadCloud className="size-6 text-base-content/50" />
      )}
      {fileNames.length > 0 ? (
        <ul className="text-sm">
          {fileNames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-base-content/70">
          Glissez vos fichiers ici, ou cliquez pour parcourir
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
}: {
  assoSlug: string;
  reportId: string;
  documentType: SupportingDocumentType;
  multiple: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    addSupportingDocumentsAction,
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

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="expenseReportId" value={reportId} />
      <input type="hidden" name="assoSlug" value={assoSlug} />
      <input type="hidden" name="documentType" value={documentType} />

      <FileDropZone key={dropZoneKey} multiple={multiple} pending={pending} />

      {!state.ok && state.error && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.error}</span>
        </div>
      )}
    </form>
  );
}

export function SupportingDocumentsPanel({
  assoSlug,
  reportId,
  documents,
  editable,
}: {
  assoSlug: string;
  reportId: string;
  documents: SupportingDocumentDetail[];
  editable: boolean;
}) {
  const receipts = documents.filter((doc) => doc.type === "RECEIPT");
  const honorStatements = documents.filter(
    (doc) => doc.type === "HONOR_STATEMENT",
  );
  // Type déjà engagé sur cette Note : l'autre carte est désactivée tant que
  // ces documents n'ont pas été supprimés (règle d'exclusivité, appliquée
  // côté serveur — ceci n'en est que le reflet visuel).
  const lockedType: SupportingDocumentType | null =
    receipts.length > 0
      ? "RECEIPT"
      : honorStatements.length > 0
        ? "HONOR_STATEMENT"
        : null;

  const [selectedType, setSelectedType] =
    useState<SupportingDocumentType | null>(lockedType);
  const [lastLockedType, setLastLockedType] = useState(lockedType);
  if (lockedType !== lastLockedType) {
    setLastLockedType(lockedType);
    if (lockedType) {
      setSelectedType(lockedType);
    }
  }

  return (
    <div className="card border border-base-300 bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title">Justificatifs</h2>

        {documents.length === 0 && (
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
                reportId={reportId}
                document={doc}
                editable={editable}
              />
            ))}
          </ul>
        )}

        {editable && (
          <>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(Object.keys(documentTypeCopy) as SupportingDocumentType[]).map(
                (type) => {
                  const disabled = lockedType !== null && lockedType !== type;
                  const checked = selectedType === type;
                  return (
                    <label
                      key={type}
                      className={`card border-2 transition-all duration-150 ${
                        checked
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                          : disabled
                            ? "cursor-not-allowed border-base-300 bg-base-200/60 opacity-50 grayscale-[0.4]"
                            : "cursor-pointer border-base-300 hover:border-primary/50 hover:bg-base-200/40"
                      }`}
                    >
                      <div className="card-body gap-1 p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={checked}
                            disabled={disabled}
                            onChange={() =>
                              setSelectedType((current) =>
                                current === type ? null : type,
                              )
                            }
                          />
                          <span className="card-title text-sm">
                            {documentTypeCopy[type].title}
                          </span>
                        </div>
                        <p className="text-xs text-base-content/70">
                          {documentTypeCopy[type].description}
                        </p>
                      </div>
                    </label>
                  );
                },
              )}
            </div>

            {selectedType && (
              <UploadForm
                key={selectedType}
                assoSlug={assoSlug}
                reportId={reportId}
                documentType={selectedType}
                multiple={selectedType === "RECEIPT"}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
