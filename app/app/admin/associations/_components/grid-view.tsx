// A tinted surface behind the grid plus a visible border and shadow on each
// card gives enough contrast for cards to read as distinct objects.
import Link from "next/link";
import { assoStatusBadgeClass, assoStatusLabel } from "@/lib/admin/asso-labels";
import type { AssoOverview } from "@/lib/admin/associations";
import { AssoSoldeCell } from "./asso-solde-cell";
import { AssoTypeAlert } from "./asso-type-alert";

export function GridView({ associations }: { associations: AssoOverview[] }) {
  return (
    <div className="rounded-box bg-base-200/60 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {associations.map((asso) => (
          <div key={asso.id} className="card card-border bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex items-start justify-between gap-2">
                <h2 className="card-title text-base">{asso.name}</h2>
                <span className={`badge ${assoStatusBadgeClass[asso.status]}`}>
                  {assoStatusLabel[asso.status]}
                </span>
              </div>
              {asso.type === null && (
                <div>
                  <AssoTypeAlert type={asso.type} />
                </div>
              )}
              <p className="text-2xl">
                <AssoSoldeCell solde={asso.solde} />
              </p>
              <p className="text-sm text-base-content/70">
                {asso.subventionsPubliees} subvention(s) publiée(s) ·{" "}
                {asso.facturesEnAttente} facture(s) en attente
              </p>
              <div className="card-actions justify-end">
                <Link
                  href={`/app/admin/associations/${asso.slug}`}
                  className="btn btn-sm"
                >
                  Voir le détail
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
