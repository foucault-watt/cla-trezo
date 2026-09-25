// Carte d'une Asso où l'Admin n'a pas de rôle (bordure en pointillés pour la
// distinguer des Assos où l'utilisateur est membre) — type, statut, Solde et
// compteurs, pour donner à l'Admin une vraie vue d'ensemble avant d'y entrer.
import Link from "next/link";
import { Building2 } from "lucide-react";
import {
  assoStatusBadgeClass,
  assoStatusLabel,
  assoTypeDisplayLabel,
} from "@/lib/admin/asso-labels";
import type { AssoOverview } from "@/lib/admin/associations";
import { pluralize } from "@/lib/plural";
import { AssoSoldeBadge } from "@/components/solde/asso-solde-badge";

export function OtherAssoCard({ asso }: { asso: AssoOverview }) {
  return (
    <Link
      href={`/app/${asso.slug}`}
      className="card min-h-48 items-center justify-center border border-dashed border-base-300 bg-base-100 text-center shadow-sm transition hover:shadow-md"
    >
      <div className="card-body items-center justify-center gap-1.5">
        <Building2 className="text-base-content/60" size={28} />
        <h2 className="card-title">{asso.name}</h2>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="badge badge-outline badge-sm">
            {assoTypeDisplayLabel(asso.type)}
          </span>
          {asso.status !== "ACTIVE" && (
            <span
              className={`badge badge-sm ${assoStatusBadgeClass[asso.status]}`}
            >
              {assoStatusLabel[asso.status]}
            </span>
          )}
        </div>
        <p className="mt-1 text-lg">
          <AssoSoldeBadge solde={asso.solde} size="sm" />
        </p>
        <p className="text-xs text-base-content/60">
          {pluralize(
            asso.subventionsPubliees,
            "subvention publiée",
            "subventions publiées",
          )}{" "}
          · {pluralize(asso.notesDeFraisEnAttente, "note")} en attente
        </p>
      </div>
    </Link>
  );
}
