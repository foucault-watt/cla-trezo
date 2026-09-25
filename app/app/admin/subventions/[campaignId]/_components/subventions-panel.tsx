"use client";

import Link from "next/link";
import { Download, FileDown, FileText } from "lucide-react";
import type { GrantDocumentRow } from "@/lib/admin/grant-documents";
import { assoTypeDisplayLabel } from "@/lib/admin/asso-labels";
import { formatCents } from "@/lib/money";
import { pluralize } from "@/lib/plural";
import { Stat, StatsBar } from "@/components/ui/stats";
import { SubventionsTable } from "./subventions-table";

const grantDocumentKindLabel = {
  CONVENTION: "Convention de subvention",
  ORDRE_DE_FINANCEMENT: "Ordre de financement",
} as const;

const generatedAtFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeZone: "Europe/Paris",
});

type Subvention = {
  id: string;
  assoId: string;
  assoName: string;
  reason: string;
  amountCents: number;
  commentary: string | null;
};

/**
 * Affiche uniquement ce que le serveur calcule : chaque ajout, modification
 * ou suppression de Subvention revalide la page (cf. subvention-actions.ts),
 * qui renvoie la liste, les totaux et l'état des Documents d'octroi à jour.
 */
export function SubventionsPanel({
  campaignId,
  subventions,
  totalAmountCents,
  assos,
  grantDocumentRows,
}: {
  campaignId: string;
  subventions: Subvention[];
  totalAmountCents: number;
  assos: { id: string; name: string }[];
  grantDocumentRows: GrantDocumentRow[];
}) {
  return (
    <>
      <StatsBar className="mt-6">
        <Stat title="Subventions" value={subventions.length} />
        <Stat title="Montant total" value={formatCents(totalAmountCents)} />
      </StatsBar>

      <section className="mt-6 rounded-box border border-base-300 bg-base-100 p-5 shadow-md sm:p-6">
        <div className="mb-4">
          <h3 className="font-semibold">Subventions</h3>
          <p className="text-xs text-base-content/60">
            Ajoutez et corrigez les subventions directement dans le tableau.
          </p>
        </div>
        <SubventionsTable
          campaignId={campaignId}
          subventions={subventions}
          assos={assos}
        />
      </section>

      <div className="ml-7 h-5 border-l-2 border-dashed border-base-300" />

      <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-md sm:p-6">
        <div className="mb-4">
          <h3 className="font-semibold">Documents d’octroi</h3>
          <p className="text-xs text-base-content/60">
            Un document par Structure regroupe toutes ses Subventions dans cette
            campagne : Convention de subvention pour une Association loi 1901,
            Ordre de financement pour un Club ou une Commission.
          </p>
        </div>

        {grantDocumentRows.length === 0 ? (
          <p className="text-sm text-base-content/70">
            Ajoutez une Subvention pour préparer un document d’octroi.
          </p>
        ) : (
          <ul className="list rounded-box border border-base-300">
            {grantDocumentRows.map((row) => {
              const typeMissing = row.kind === null;
              return (
                <li className="list-row items-center" key={row.assoId}>
                  <FileDown size={20} className="text-base-content/60" />
                  <div>
                    <p className="font-medium">{row.assoName}</p>
                    <p className="text-xs text-base-content/60">
                      {row.kind && <>{grantDocumentKindLabel[row.kind]} · </>}
                      {pluralize(row.subventionCount, "subvention")} ·{" "}
                      {formatCents(row.totalAmountCents)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      {typeMissing ? (
                        <span className="badge badge-error badge-soft badge-sm">
                          {assoTypeDisplayLabel(null)}
                        </span>
                      ) : row.document ? (
                        <>
                          <span className="text-base-content/60">
                            Généré le{" "}
                            {generatedAtFormatter.format(
                              row.document.generatedAt,
                            )}
                          </span>
                          {row.document.stale && (
                            <span className="badge badge-warning badge-soft badge-sm">
                              À régénérer
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="badge badge-ghost badge-sm">
                          Non généré
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {row.document && (
                      <a
                        href={`/app/admin/subventions/${campaignId}/octroi/${row.assoId}/document`}
                        className="btn btn-sm btn-ghost"
                      >
                        <Download size={16} />
                        Télécharger
                      </a>
                    )}
                    {!typeMissing && (
                      <Link
                        href={`/app/admin/subventions/${campaignId}/octroi/${row.assoId}`}
                        className="btn btn-sm"
                      >
                        <FileText size={16} />
                        {row.document ? "Régénérer" : "Préparer le document"}
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
