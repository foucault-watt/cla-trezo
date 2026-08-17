import type { AssoMember } from "@/lib/asso/members";
import type { ExpenseReportLineDetail } from "@/lib/expense-reports/expense-report-detail-mapping";

export type PersonGroup = {
  key: string;
  firstname: string;
  lastname: string;
  role: string | null;
  isKnownMember: boolean;
  lines: ExpenseReportLineDetail[];
  /** Somme des Lignes financées par le Solde du Club (cf. FundingSourceType). */
  clubBalanceTotalCents: number;
  /** Somme des Lignes financées par une Subvention. */
  subventionTotalCents: number;
};

/**
 * Clé de correspondance d'un bénéficiaire par nom, insensible à la casse et
 * aux espaces superflus — exportée pour que l'UI puisse retrouver le groupe
 * d'une personne après l'ajout d'une Ligne (cf. PersonGroupsBoard).
 */
export function personKey(firstname: string, lastname: string): string {
  return `${firstname.trim()} ${lastname.trim()}`.toLowerCase();
}

/**
 * Regroupe les Lignes d'une Note de frais par bénéficiaire, pour l'affichage
 * (cf. plan "Regrouper les Lignes par bénéficiaire") : un groupe par Membre
 * actif de la Structure (même sans Ligne, pour pouvoir en ajouter une
 * première), plus un groupe par nom distinct pour les bénéficiaires hors
 * BDD (saisie libre, jamais de fiche persistante). Aucun changement de
 * stockage — la correspondance se fait uniquement par nom, insensible à la
 * casse et aux espaces superflus.
 */
export function groupLinesByPerson(
  lines: ExpenseReportLineDetail[],
  members: AssoMember[],
): PersonGroup[] {
  const groupsByKey = new Map<string, PersonGroup>();

  for (const member of members) {
    const key = personKey(member.firstname, member.lastname);
    groupsByKey.set(key, {
      key,
      firstname: member.firstname,
      lastname: member.lastname,
      role: member.role,
      isKnownMember: true,
      lines: [],
      clubBalanceTotalCents: 0,
      subventionTotalCents: 0,
    });
  }

  for (const line of lines) {
    const key = personKey(line.beneficiaryFirstname, line.beneficiaryLastname);
    const existing = groupsByKey.get(key);
    if (existing) {
      existing.lines.push(line);
      continue;
    }
    groupsByKey.set(key, {
      key,
      firstname: line.beneficiaryFirstname,
      lastname: line.beneficiaryLastname,
      role: null,
      isKnownMember: false,
      lines: [line],
      clubBalanceTotalCents: 0,
      subventionTotalCents: 0,
    });
  }

  for (const group of groupsByKey.values()) {
    for (const line of group.lines) {
      if (line.fundingSource === "CLUB_BALANCE") {
        group.clubBalanceTotalCents += line.amountCents;
      } else {
        group.subventionTotalCents += line.amountCents;
      }
    }
  }

  return [...groupsByKey.values()].sort((a, b) => {
    const lastnameCompare = a.lastname.localeCompare(b.lastname);
    if (lastnameCompare !== 0) return lastnameCompare;
    return a.firstname.localeCompare(b.firstname);
  });
}
