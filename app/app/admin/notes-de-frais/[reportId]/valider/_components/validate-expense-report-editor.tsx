"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { ExpenseReportPdfData } from "@/pdf-lab/templates/ndf-fn-sb/types";
import type { ExpenseBalancePdfData } from "@/pdf-lab/templates/ndf-solde/types";
import {
  validateExpenseReportAction,
  type ValidateExpenseReportGroupInput,
} from "@/lib/admin/validate-expense-report-action";
import type { ExpenseReportValidationGroup } from "@/lib/admin/expense-report-validation-preparation";
import { SubventionPdfFields } from "./subvention-pdf-fields";
import { SoldePdfFields } from "./solde-pdf-fields";

type DocumentState =
  | { key: string; kind: "SUBVENTION"; subventionId: string; data: ExpenseReportPdfData }
  | { key: string; kind: "CLUB_BALANCE"; data: ExpenseBalancePdfData };

function tabLabel(document: DocumentState): string {
  return document.kind === "CLUB_BALANCE" ? "Solde" : document.data.grantName;
}

/**
 * Aperçu éditable puis confirmation de la Validation d'une Note de frais
 * (issue #20) : un onglet par document à générer (un par Subvention
 * distincte, plus un pour le Solde si applicable), chaque onglet totalement
 * éditable comme dans l'atelier pdf-lab. L'édition ne change que le PDF —
 * les mouvements financiers, la suppression de l'IBAN et le passage à
 * Validée restent calculés côté serveur à partir des vraies Lignes de la
 * Note (cf. validate-expense-report-action.ts).
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
        setError(result.error ?? "La validation a échoué.");
        return;
      }
      router.push(`/app/admin/notes-de-frais/${reportId}/remboursements`);
    });
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
              current.map((document) =>
                document.key === active.key && document.kind === "CLUB_BALANCE"
                  ? { ...document, data }
                  : document,
              ),
            )
          }
        />
      ) : (
        <SubventionPdfFields
          data={active.data}
          onChange={(data) =>
            setDocuments((current) =>
              current.map((document) =>
                document.key === active.key && document.kind === "SUBVENTION"
                  ? { ...document, data }
                  : document,
              ),
            )
          }
        />
      )}

      {error && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end border-t border-base-300 pt-4">
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
          {pending ? "Validation…" : "Confirmer la validation"}
        </button>
      </div>
    </div>
  );
}
