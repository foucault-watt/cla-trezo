import Link from "next/link";
import { FileText } from "lucide-react";
import { formatShortDate } from "@/lib/dates";
import type { AssoType } from "@/app/generated/prisma/enums";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";
import { groupSubventionsByCampaign } from "@/lib/subventions/subvention-campaigns";

/**
 * Documents de Subvention d'une Structure, un par Campagne : Convention de
 * subvention pour une Association loi 1901, Ordre de financement pour un
 * Club/Commission (cf. CONTEXT.md).
 *
 * Chaque Document d'octroi se prépare, se génère puis se télécharge depuis
 * la page de la Campagne (/app/admin/subventions/[campaignId]/octroi/[assoId],
 * cf. ADR-0007).
 */
export function DocumentsList({
  assoId,
  assoType,
  subventions,
}: {
  assoId: string;
  assoType: Exclude<AssoType, null>;
  subventions: VisibleSubvention[];
}) {
  const campaigns = groupSubventionsByCampaign(subventions);

  if (campaigns.length === 0) {
    return (
      <p className="text-sm text-base-content/60">
        Aucun document généré pour l&apos;instant.
      </p>
    );
  }

  const isAssociation1901 = assoType === "ASSOCIATION_1901";
  const documentLabel = isAssociation1901
    ? "Convention de subvention"
    : "Ordre de financement";

  return (
    <ul className="flex flex-col divide-y divide-base-200">
      {campaigns.map((campaign) => (
        <li
          key={campaign.id}
          className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
        >
          <div className="flex items-center gap-2">
            <FileText
              size={14}
              aria-hidden="true"
              className="shrink-0 text-base-content/50"
            />
            <div>
              <span>{documentLabel}</span>
              <div className="text-xs text-base-content/50">
                {campaign.name} · {formatShortDate(campaign.publicationDate)}
              </div>
            </div>
          </div>

          <Link
            href={`/app/admin/subventions/${campaign.id}/octroi/${assoId}`}
            className="link flex items-center gap-1 text-xs"
          >
            Préparer le document
          </Link>
        </li>
      ))}
    </ul>
  );
}
