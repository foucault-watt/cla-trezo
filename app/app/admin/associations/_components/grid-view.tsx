// Cards are bg-base-100 with a border-base-300 + shadow-md, which is enough
// contrast against the page canvas (bg-base-200, set at the layout level in
// SidebarDrawer) for each card to read as a distinct elevated object.
import Link from "next/link";
import { Eye } from "lucide-react";
import { assoStatusBadgeClass, assoStatusLabel } from "@/lib/admin/asso-labels";
import type { AssoOverview } from "@/lib/admin/associations";
import { AssoSoldeBadge } from "@/components/solde/asso-solde-badge";
import { AssoTypeAlert } from "./asso-type-alert";

export function GridView({ associations }: { associations: AssoOverview[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {associations.map((asso) => (
        <div key={asso.id} className="card border border-base-300 bg-base-100 shadow-md">
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
              <AssoSoldeBadge solde={asso.solde} />
            </p>
            <p className="text-sm text-base-content/70">
              {asso.subventionsPubliees} subvention(s) publiée(s) ·{" "}
              {asso.notesDeFraisEnAttente} note(s) de frais en attente
            </p>
            <div className="card-actions justify-end">
              <Link
                href={`/app/admin/associations/${asso.slug}`}
                className="btn btn-sm"
              >
                <Eye size={16} />
                Voir le détail
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
