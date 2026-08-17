import { fundingSourceLabel } from "@/lib/expense-reports/labels";
import { formatCents } from "@/lib/money";

/**
 * Badges "Solde" / "Subvention" affichant le total utilisé par une personne
 * sur chacune des deux sources de financement, uniquement quand non nul.
 * Partagé par les vues Structure et Admin (cf. PersonGroupsBoard /
 * PersonGroupsAdmin).
 */
export function PersonFundingBadges({
  clubBalanceTotalCents,
  subventionTotalCents,
}: {
  clubBalanceTotalCents: number;
  subventionTotalCents: number;
}) {
  return (
    <>
      {clubBalanceTotalCents !== 0 && (
        <span className="badge badge-outline badge-sm">
          {fundingSourceLabel.CLUB_BALANCE} : {formatCents(clubBalanceTotalCents)}
        </span>
      )}
      {subventionTotalCents !== 0 && (
        <span className="badge badge-outline badge-sm">
          {fundingSourceLabel.SUBVENTION} : {formatCents(subventionTotalCents)}
        </span>
      )}
    </>
  );
}
