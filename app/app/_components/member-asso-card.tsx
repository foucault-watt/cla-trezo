// Carte d'une Asso où l'utilisateur a un rôle. Une colonne sur mobile,
// grille classique à partir de sm.
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { assoTypeLabel } from "@/lib/admin/asso-labels";
import { AssoSoldeInline } from "./asso-solde-inline";
import type { MemberAssoCard as MemberAssoCardData } from "./home-types";

export function MemberAssoCard({ card }: { card: MemberAssoCardData }) {
  return (
    <Link
      href={`/app/${card.slug}`}
      className="card border border-base-300 bg-base-100 shadow-md transition hover:shadow-lg"
    >
      <div className="card-body gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <Building2 className="text-base-content/60" size={24} />
          {card.overview?.type && (
            <span className="badge badge-outline badge-sm">
              {assoTypeLabel[card.overview.type]}
            </span>
          )}
        </div>
        <h2 className="card-title">{card.name}</h2>
        <p className="text-xs text-base-content/60">{card.role}</p>
        {card.overview && (
          <p className="text-lg">
            <AssoSoldeInline solde={card.overview.solde} />
          </p>
        )}
        <div className="card-actions mt-1">
          <span className="btn btn-primary btn-sm btn-block pointer-events-none">
            <ArrowRight size={16} />
            Ouvrir
          </span>
        </div>
      </div>
    </Link>
  );
}
