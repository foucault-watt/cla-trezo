import type { AssoMember } from "@/lib/asso/members";
import { groupLinesByPerson } from "@/lib/expense-reports/group-lines-by-person";
import type { ExpenseReportLineDetail } from "@/lib/expense-reports/expense-report-detail-mapping";
import { PersonFundingBadges } from "@/components/expense-reports/person-funding-badges";
import { AdminLigneRow } from "./admin-ligne-row";

/**
 * Vue Admin des Lignes d'une Note de frais, regroupées par bénéficiaire
 * (Membre de la Structure ou personne hors BDD) plutôt qu'en liste plate —
 * changement purement visuel, lecture seule comme avant (cf. plan
 * "Regrouper les Lignes par bénéficiaire").
 */
export function PersonGroupsAdmin({
  lines,
  members,
}: {
  lines: ExpenseReportLineDetail[];
  members: AssoMember[];
}) {
  const groups = groupLinesByPerson(lines, members).filter(
    (group) => group.lines.length > 0,
  );

  if (groups.length === 0) {
    return (
      <p className="text-base-content/70">Aucune Ligne pour l&apos;instant.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div
          key={group.key}
          className="card border border-base-300 bg-base-100 shadow-md"
        >
          <div className="card-body gap-3">
            <div className="flex items-center gap-2">
              <h3 className="card-title text-base">
                {group.firstname} {group.lastname}
              </h3>
              {group.isKnownMember ? (
                <span className="badge badge-primary badge-sm">
                  {group.role}
                </span>
              ) : (
                <span className="badge badge-ghost badge-sm">
                  Hors Structure
                </span>
              )}
              <PersonFundingBadges
                clubBalanceTotalCents={group.clubBalanceTotalCents}
                subventionTotalCents={group.subventionTotalCents}
              />
            </div>

            <div className="overflow-x-auto rounded-box border border-base-300">
              <table className="table">
                <thead>
                  <tr>
                    <th>IBAN</th>
                    <th>Nom de la dépense</th>
                    <th>Type de dépense</th>
                    <th>Montant</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {group.lines.map((line) => (
                    <AdminLigneRow
                      key={line.id}
                      line={line}
                      showBeneficiaryColumn={false}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
