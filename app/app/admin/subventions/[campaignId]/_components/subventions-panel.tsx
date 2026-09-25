"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, FileDown, FileText } from "lucide-react";
import type { GrantDocumentStatus } from "@/lib/admin/grant-documents";
import { formatCents } from "@/lib/money";
import { pluralize } from "@/lib/plural";
import { Stat, StatsBar } from "@/components/ui/stats";
import { SubventionsTable } from "./subventions-table";
import type { AddSubventionState } from "@/lib/admin/subvention-actions";

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

export function SubventionsPanel({
  campaignId,
  initialSubventions,
  assos,
  grantDocumentStatuses,
}: {
  campaignId: string;
  initialSubventions: Subvention[];
  assos: { id: string; name: string }[];
  grantDocumentStatuses: Record<string, GrantDocumentStatus>;
}) {
  const [subventions, setSubventions] = useState(initialSubventions);

  const totalAmountCents = subventions.reduce(
    (sum, s) => sum + s.amountCents,
    0,
  );

  const conventionGroups = useMemo(
    () =>
      Array.from(
        subventions
          .reduce((groups, subvention) => {
            const current = groups.get(subvention.assoId);
            groups.set(subvention.assoId, {
              assoId: subvention.assoId,
              assoName: subvention.assoName,
              linesCount: (current?.linesCount ?? 0) + 1,
              totalAmountCents:
                (current?.totalAmountCents ?? 0) + subvention.amountCents,
            });
            return groups;
          }, new Map<string, { assoId: string; assoName: string; linesCount: number; totalAmountCents: number }>())
          .values(),
      ),
    [subventions],
  );

  function handleAdded(created: NonNullable<AddSubventionState["subvention"]>) {
    const assoName =
      assos.find((asso) => asso.id === created.assoId)?.name ?? "";
    setSubventions((prev) => [{ ...created, assoName }, ...prev]);
  }

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
          onAdded={handleAdded}
        />
      </section>

      <div className="ml-7 h-5 border-l-2 border-dashed border-base-300" />

      <section className="rounded-box border border-base-300 bg-base-100 p-5 shadow-md sm:p-6">
        <div className="mb-4">
          <h3 className="font-semibold">Documents d’octroi</h3>
          <p className="text-xs text-base-content/60">
            Un document par Structure regroupe toutes ses Subventions dans
            cette campagne : Convention de subvention pour une Association loi 1901,
            Ordre de financement pour un Club ou une Commission.
          </p>
        </div>

        {conventionGroups.length === 0 ? (
          <p className="text-sm text-base-content/70">
            Ajoutez une Subvention pour préparer un document d’octroi.
          </p>
        ) : (
          <ul className="list rounded-box border border-base-300">
            {conventionGroups.map((group) => {
              const status = grantDocumentStatuses[group.assoId];
              const typeMissing = status !== undefined && status.kind === null;
              return (
                <li className="list-row items-center" key={group.assoId}>
                  <FileDown size={20} className="text-base-content/60" />
                  <div>
                    <p className="font-medium">{group.assoName}</p>
                    <p className="text-xs text-base-content/60">
                      {status?.kind && (
                        <>{grantDocumentKindLabel[status.kind]} · </>
                      )}
                      {pluralize(group.linesCount, "subvention")} ·{" "}
                      {formatCents(group.totalAmountCents)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      {typeMissing ? (
                        <>
                          <span className="badge badge-error badge-soft badge-sm">
                            Type de Structure non renseigné
                          </span>
                          <Link
                            href={`/app/admin/associations/${status.assoSlug}`}
                            className="link"
                          >
                            Classer la Structure
                          </Link>
                        </>
                      ) : status?.document ? (
                        <>
                          <span className="text-base-content/60">
                            Généré le{" "}
                            {generatedAtFormatter.format(
                              status.document.generatedAt,
                            )}
                          </span>
                          {status.document.stale && (
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
                    {status?.document && (
                      <a
                        href={`/app/admin/subventions/${campaignId}/octroi/${group.assoId}/document`}
                        className="btn btn-sm btn-ghost"
                      >
                        <Download size={16} />
                        Télécharger
                      </a>
                    )}
                    {!typeMissing && (
                      <Link
                        href={`/app/admin/subventions/${campaignId}/octroi/${group.assoId}`}
                        className="btn btn-sm"
                      >
                        <FileText size={16} />
                        {status?.document
                          ? "Régénérer"
                          : "Préparer le document"}
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
