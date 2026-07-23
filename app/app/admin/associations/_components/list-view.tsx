// Row-based (not a literal <table>), dense, zebra-striped.
// Status is a fixed-width dot at the start (never variable-width text there,
// since that would shift every column after it) and the full text badge
// moves to the end of the row, where its width can vary safely.
import Link from "next/link";
import {
  assoStatusBadgeClass,
  assoStatusDotClass,
  assoStatusLabel,
} from "@/lib/admin/asso-labels";
import type { AssoOverview } from "@/lib/admin/associations";
import { AssoSoldeCell } from "./asso-solde-cell";
import { AssoTypeAlert } from "./asso-type-alert";

export function ListView({ associations }: { associations: AssoOverview[] }) {
  return (
    <div className="overflow-hidden rounded-box border border-base-300">
      {associations.map((asso, i) => (
        <Link
          key={asso.id}
          href={`/app/admin/associations/${asso.slug}`}
          className={`flex items-center gap-3 px-4 py-2.5 hover:bg-base-300/40 ${
            i % 2 === 1 ? "bg-base-200/60" : "bg-base-100"
          }`}
        >
          <span
            className={`size-2.5 shrink-0 rounded-full ${assoStatusDotClass[asso.status]}`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{asso.name}</span>
              <AssoTypeAlert type={asso.type} />
            </div>
            <div className="truncate text-xs text-base-content/60 sm:hidden">
              {asso.subventionsPubliees} subvention(s) ·{" "}
              {asso.facturesEnAttente} facture(s)
            </div>
          </div>
          <div className="hidden w-28 shrink-0 text-right text-sm text-base-content/70 sm:block">
            {asso.subventionsPubliees} subv.
          </div>
          <div className="hidden w-32 shrink-0 text-right text-sm text-base-content/70 sm:block">
            {asso.facturesEnAttente} facture(s)
          </div>
          <div className="w-28 shrink-0 text-right">
            <AssoSoldeCell solde={asso.solde} />
          </div>
          <span
            className={`badge shrink-0 ${assoStatusBadgeClass[asso.status]}`}
          >
            {assoStatusLabel[asso.status]}
          </span>
        </Link>
      ))}
    </div>
  );
}
