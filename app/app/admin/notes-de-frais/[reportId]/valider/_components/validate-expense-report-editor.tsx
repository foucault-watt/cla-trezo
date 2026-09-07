"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Save, X } from "lucide-react";
import type { ExpenseReportPdfData } from "@/pdf-lab/templates/ndf-fn-sb/types";
import type { ExpenseBalancePdfData } from "@/pdf-lab/templates/ndf-solde/types";
import {
  validateExpenseReportAction,
  type GeneratedExpenseReportPdf,
  type ValidateExpenseReportGroupInput,
} from "@/lib/admin/validate-expense-report-action";
import type { ExpenseReportValidationGroup } from "@/lib/admin/expense-report-validation-preparation";
import { Modal, type ModalHandle } from "@/components/ui/modal";
import { fundingSourceLabel } from "@/lib/expense-reports/labels";
import { SubventionPdfFields } from "./subvention-pdf-fields";
import { SoldePdfFields } from "./solde-pdf-fields";

type DocumentState =
  | {
      key: string;
      kind: "SUBVENTION";
      subventionId: string;
      data: ExpenseReportPdfData;
    }
  | { key: string; kind: "CLUB_BALANCE"; data: ExpenseBalancePdfData };

function tabLabel(document: DocumentState): string {
  return document.kind === "CLUB_BALANCE"
    ? fundingSourceLabel.CLUB_BALANCE
    : document.data.grantName;
}

/**
 * Remplace les données du document `key` sans perdre son `kind` ni son
 * éventuel `subventionId` — la Ligne appelante connaît toujours le type de
 * `data` associé à ce `key` (cf. SoldePdfFields/SubventionPdfFields
 * ci-dessous), TypeScript ne peut simplement pas le vérifier à travers le
 * `.map` sur l'union `DocumentState`.
 */
function replaceDocumentData(
  documents: DocumentState[],
  key: string,
  data: ExpenseReportPdfData | ExpenseBalancePdfData,
): DocumentState[] {
  return documents.map((document) =>
    document.key === key ? ({ ...document, data } as DocumentState) : document,
  );
}

function pdfLabel(
  pdf: GeneratedExpenseReportPdf,
  documents: DocumentState[],
): string {
  const document = documents.find(
    (candidate) =>
      (candidate.kind === "CLUB_BALANCE" &&
        pdf.fundingSource === "CLUB_BALANCE") ||
      (candidate.kind === "SUBVENTION" &&
        candidate.subventionId === pdf.subventionId),
  );
  return document ? tabLabel(document) : "PDF";
}

/**
 * Aperçu éditable puis confirmation de la Validation d'une Note de frais
 * (issue #20) : un onglet par document à générer (un par Subvention
 * distincte, plus un pour le Solde si applicable), chaque onglet totalement
 * éditable comme dans l'atelier pdf-lab. L'édition ne change que le PDF —
 * les mouvements financiers, la suppression de l'IBAN et le passage à
 * Validée restent calculés côté serveur à partir des vraies Lignes de la
 * Note (cf. validate-expense-report-action.ts). La confirmation passe par
 * une modale (cette action est définitive), suivie d'une seconde proposant
 * le téléchargement des PDF générés — même pattern de modale que le reste
 * du site (cf. components/ui/modal.tsx).
 */
export function ValidateExpenseReportEditor({
  reportId,
  groups,
}: {
  reportId: string;
  groups: ExpenseReportValidationGroup[];
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentState[]>(() =>
    groups.map((group) =>
      group.kind === "CLUB_BALANCE"
        ? { key: group.key, kind: "CLUB_BALANCE", data: group.data }
        : {
            key: group.key,
            kind: "SUBVENTION",
            subventionId: group.subventionId,
            data: group.data,
          },
    ),
  );
  const [activeKey, setActiveKey] = useState(documents[0]?.key);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [generatedPdfs, setGeneratedPdfs] = useState<
    GeneratedExpenseReportPdf[]
  >([]);
  const confirmModalRef = useRef<ModalHandle>(null);
  const successModalRef = useRef<ModalHandle>(null);

  const active = documents.find((document) => document.key === activeKey);

  function confirm() {
    setError(null);
    startTransition(async () => {
      const payload: ValidateExpenseReportGroupInput[] = documents.map(
        (document) =>
          document.kind === "CLUB_BALANCE"
            ? { kind: "CLUB_BALANCE", data: document.data }
            : {
                kind: "SUBVENTION",
                subventionId: document.subventionId,
                data: document.data,
              },
      );
      const result = await validateExpenseReportAction(reportId, payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      confirmModalRef.current?.close();
      setGeneratedPdfs(result.pdfs);
      successModalRef.current?.open();
    });
  }

  function finish() {
    successModalRef.current?.close();
    router.push(`/app/admin/notes-de-frais/${reportId}/remboursements`);
  }

  if (!active) return null;

  return (
    <div className="space-y-6">
      {documents.length > 1 && (
        <div role="tablist" className="tabs tabs-box w-fit">
          {documents.map((document) => (
            <button
              key={document.key}
              type="button"
              role="tab"
              className={`tab ${document.key === activeKey ? "tab-active" : ""}`}
              onClick={() => setActiveKey(document.key)}
            >
              {tabLabel(document)}
            </button>
          ))}
        </div>
      )}

      {active.kind === "CLUB_BALANCE" ? (
        <SoldePdfFields
          data={active.data}
          onChange={(data) =>
            setDocuments((current) =>
              replaceDocumentData(current, active.key, data),
            )
          }
        />
      ) : (
        <SubventionPdfFields
          data={active.data}
          onChange={(data) =>
            setDocuments((current) =>
              replaceDocumentData(current, active.key, data),
            )
          }
        />
      )}

      <div className="flex justify-end border-t border-base-300 pt-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => confirmModalRef.current?.open()}
        >
          <Save size={18} />
          Valider la note de frais
        </button>
      </div>

      <Modal ref={confirmModalRef} title="Valider cette Note de frais ?">
        <p className="text-sm text-base-content/80">
          Cette action est définitive : la Note deviendra immuable, le Solde et
          les Subventions concernées seront mis à jour, et l&apos;IBAN sera
          supprimé de la base.
        </p>
        {error && (
          <div role="alert" className="alert alert-error alert-soft mt-4">
            <span>{error}</span>
          </div>
        )}
        <div className="modal-action">
          <button
            type="button"
            className="btn"
            onClick={() => confirmModalRef.current?.close()}
            disabled={pending}
          >
            <X size={18} />
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={confirm}
            disabled={pending}
          >
            {pending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <Save size={18} />
            )}
            {pending ? "Validation…" : "Confirmer"}
          </button>
        </div>
      </Modal>

      <Modal ref={successModalRef} title="Note de frais validée">
        <p className="text-sm text-base-content/80">
          La validation a réussi. Téléchargez le ou les PDF générés :
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {generatedPdfs.map((pdf) => (
            <li key={pdf.id}>
              <a
                href={`/app/admin/notes-de-frais/${reportId}/pdfs/${pdf.id}`}
                className="btn btn-soft btn-sm"
              >
                <Download size={16} />
                {pdfLabel(pdf, documents)}
              </a>
            </li>
          ))}
        </ul>
        <div className="modal-action">
          <button type="button" className="btn btn-primary" onClick={finish}>
            <CheckCircle2 size={18} />
            Terminer
          </button>
        </div>
      </Modal>
    </div>
  );
}
