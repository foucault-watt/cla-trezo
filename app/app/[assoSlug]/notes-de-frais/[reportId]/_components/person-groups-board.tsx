"use client";

import { useState } from "react";
import type { AssoType } from "@/app/generated/prisma/enums";
import type { AssoMember } from "@/lib/asso/members";
import {
  groupLinesByPerson,
  personKey,
} from "@/lib/expense-reports/group-lines-by-person";
import type {
  ExpenseReportLineDetail,
  TypeDepenseOption,
} from "@/lib/expense-reports/expense-reports";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";
import { PersonFundingBadges } from "@/components/expense-reports/person-funding-badges";
import { AddLigneForm } from "./add-ligne-form";
import { LigneRow } from "./ligne-row";

type AddTarget =
  | { kind: "existing"; key: string; firstname: string; lastname: string }
  | { kind: "new" };

/**
 * Regroupe l'affichage des Lignes par bénéficiaire (Membre de la Structure
 * ou personne hors BDD) plutôt qu'en liste plate — changement purement
 * visuel, cf. plan "Regrouper les Lignes par bénéficiaire". Un seul point
 * d'ajout en bas de page (pas un formulaire dupliqué par carte) : on choisit
 * d'abord à qui la Ligne est destinée (bouton "Ajouter à…"), ce qui évite de
 * retaper le nom d'un bénéficiaire déjà affiché plus haut. `ibanByKey` ne
 * mémorise l'IBAN saisi que côté client, le temps de la session de saisie,
 * pour éviter de le retaper à chaque Ligne d'une même personne : rien n'est
 * envoyé au serveur au-delà de ce qui existait déjà (ADR-0002 inchangé).
 */
export function PersonGroupsBoard({
  assoSlug,
  expenseReportId,
  lines,
  members,
  assoType,
  typeDepenses,
  visibleSubventions,
  editable,
}: {
  assoSlug: string;
  expenseReportId: string;
  lines: ExpenseReportLineDetail[];
  members: AssoMember[];
  assoType: AssoType | null;
  typeDepenses: TypeDepenseOption[];
  visibleSubventions: VisibleSubvention[];
  editable: boolean;
}) {
  const [ibanByKey, setIbanByKey] = useState<Record<string, string>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [target, setTarget] = useState<AddTarget | null>(null);

  const groups = groupLinesByPerson(lines, members);
  const groupsWithLines = groups.filter((group) => group.lines.length > 0);

  function closeForm() {
    setTarget(null);
    setMenuOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {groupsWithLines.length === 0 && (
        <p className="text-base-content/70">
          Aucune Ligne pour l&apos;instant.
        </p>
      )}

      {groupsWithLines.map((group) => (
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
                    <th>Nom de la dépense</th>
                    <th>Type de dépense</th>
                    <th>Montant</th>
                    <th>Source</th>
                    {editable && <th />}
                  </tr>
                </thead>
                <tbody>
                  {group.lines.map((line) => (
                    <LigneRow
                      key={line.id}
                      assoSlug={assoSlug}
                      line={line}
                      assoType={assoType}
                      typeDepenses={typeDepenses}
                      visibleSubventions={visibleSubventions}
                      editable={editable}
                      showBeneficiaryColumn={false}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}

      {editable && (
        <div className="card border border-base-300 bg-base-100 shadow-md">
          <div className="card-body gap-3">
            {target ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">
                    Ajouter à{" "}
                    {target.kind === "existing"
                      ? `${target.firstname} ${target.lastname}`
                      : "une nouvelle personne"}
                  </h3>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={closeForm}
                  >
                    Annuler
                  </button>
                </div>
                <AddLigneForm
                  assoSlug={assoSlug}
                  expenseReportId={expenseReportId}
                  assoType={assoType}
                  typeDepenses={typeDepenses}
                  visibleSubventions={visibleSubventions}
                  lockedBeneficiary={
                    target.kind === "existing"
                      ? {
                          firstname: target.firstname,
                          lastname: target.lastname,
                        }
                      : undefined
                  }
                  initialIban={
                    target.kind === "existing"
                      ? (ibanByKey[target.key] ?? "")
                      : ""
                  }
                  onSuccess={(values) => {
                    const key = personKey(values.firstname, values.lastname);
                    setIbanByKey((current) => ({
                      ...current,
                      [key]: values.iban,
                    }));
                    // Une fois la 1ère Ligne d'une nouvelle personne créée, on
                    // bascule sur "existing" pour verrouiller son nom et
                    // réutiliser son IBAN sur les Lignes suivantes, sans
                    // repasser par le menu.
                    setTarget({
                      kind: "existing",
                      key,
                      firstname: values.firstname,
                      lastname: values.lastname,
                    });
                  }}
                />
              </>
            ) : (
              <div className="dropdown">
                <button
                  type="button"
                  className="btn btn-primary btn-block h-auto justify-center py-3 mx-auto"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  Ajouter un ligne
                </button>
                {menuOpen && (
                  <ul className="menu dropdown-content z-10 mt-2 w-72 gap-1 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
                    {groups.map((group) => (
                      <li key={group.key}>
                        <button
                          type="button"
                          className="btn btn-soft h-auto justify-between py-3"
                          onClick={() =>
                            setTarget({
                              kind: "existing",
                              key: group.key,
                              firstname: group.firstname,
                              lastname: group.lastname,
                            })
                          }
                        >
                          <span>
                            {group.firstname} {group.lastname}
                          </span>
                          {group.isKnownMember ? (
                            <span className="badge badge-primary badge-sm">
                              {group.role}
                            </span>
                          ) : (
                            <span className="badge badge-ghost badge-sm">
                              Hors Structure
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        type="button"
                        className="btn btn-soft h-auto justify-center py-3"
                        onClick={() => {
                          setTarget({ kind: "new" });
                          setMenuOpen(false);
                        }}
                      >
                        + Nouvelle personne
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
