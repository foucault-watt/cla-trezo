// Ligne dense pour la liste Admin des Associations — même forme que
// `CampaignRow` / `AdminExpenseReportRow` (pastille de statut en tête, badge
// texte en fin, cf. règle "Status/badge placement" de docs/design/COMPONENTS.md),
// pour garder un seul vocabulaire de liste dense dans tout le produit. Comme
// les autres listes denses, la grille à largeurs fixes n'a plus la place sous
// `sm` : on bascule sur une carte empilée pour éviter le chevauchement.
import Link from "next/link";
import {
  assoStatusBadgeClass,
  assoStatusDotClass,
  assoStatusLabel,
} from "@/lib/admin/asso-labels";
import type { AssoOverview } from "@/lib/admin/associations";
import { pluralize } from "@/lib/plural";
import { AssoSoldeBadge } from "@/components/solde/asso-solde-badge";
import { AssoTypeAlert } from "./asso-type-alert";

export function AssociationRow({
  asso,
  striped = false,
}: {
  asso: AssoOverview;
  striped?: boolean;
}) {
  const href = `/app/admin/associations/${asso.slug}`;
  const rowBg = striped ? "bg-base-200/60" : "";

  return (
    <>
      <Link
        href={href}
        className={`flex flex-col gap-1 px-4 py-2.5 hover:bg-base-300/40 sm:hidden ${rowBg}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`size-2.5 shrink-0 rounded-full ${assoStatusDotClass[asso.status]}`}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate font-medium">
            {asso.name}
          </span>
          <span
            className={`badge badge-sm shrink-0 ${assoStatusBadgeClass[asso.status]}`}
          >
            {assoStatusLabel[asso.status]}
          </span>
        </div>
        {asso.type === null && (
          <div className="pl-[1.125rem]">
            <AssoTypeAlert type={asso.type} />
          </div>
        )}
        <div className="flex items-center justify-between pl-[1.125rem] text-xs text-base-content/60">
          <span>
            {pluralize(
              asso.subventionsPubliees,
              "subvention publiée",
              "subventions publiées",
            )}{" "}
            · {pluralize(asso.notesDeFraisEnAttente, "note")} en attente
          </span>
          <span className="font-medium text-base-content/70">
            <AssoSoldeBadge solde={asso.solde} size="sm" />
          </span>
        </div>
      </Link>

      <Link
        href={href}
        className={`hidden items-center gap-3 px-4 py-2.5 hover:bg-base-300/40 sm:flex ${rowBg}`}
      >
        <span
          className={`size-2.5 shrink-0 rounded-full ${assoStatusDotClass[asso.status]}`}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate font-medium">{asso.name}</span>
          <AssoTypeAlert type={asso.type} />
        </div>
        {/* Libellés complets plutôt qu'abrégés (« subv. ») : la liste n'a pas
            d'en-têtes de colonnes, le texte doit se suffire. La colonne
            Subventions, plus large, n'apparaît qu'à partir de `xl` pour
            laisser la place au nom sous la sidebar. */}
        <div className="hidden w-44 shrink-0 whitespace-nowrap text-right text-sm text-base-content/70 xl:block">
          {pluralize(
            asso.subventionsPubliees,
            "subvention publiée",
            "subventions publiées",
          )}
        </div>
        <div className="hidden w-36 shrink-0 whitespace-nowrap text-right text-sm text-base-content/70 sm:block">
          {pluralize(asso.notesDeFraisEnAttente, "note")} en attente
        </div>
        <div className="w-28 shrink-0 text-right">
          <AssoSoldeBadge solde={asso.solde} />
        </div>
        <div className="flex w-32 shrink-0 justify-end">
          <span className={`badge ${assoStatusBadgeClass[asso.status]}`}>
            {assoStatusLabel[asso.status]}
          </span>
        </div>
      </Link>
    </>
  );
}
