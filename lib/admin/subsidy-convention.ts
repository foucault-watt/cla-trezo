import type { ConventionRepresentative } from "@/pdf-lab/templates/convention/types";

const PARIS_TIME_ZONE = "Europe/Paris";

export function parisDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PARIS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return { year: value("year"), month: value("month"), day: value("day") };
}

export function conventionPeriodForPublicationDate(date: Date): string {
  const { year, month } = parisDateParts(date);
  const startYear = month >= 9 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

export function formatConventionDate(date: Date): string {
  const { year, month, day } = parisDateParts(date);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function normalizeRole(role: string) {
  return role
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR");
}

type ActiveMember = {
  firstname: string;
  lastname: string;
  role: string;
};

export function beneficiaryRepresentativesFromMembers(
  members: ActiveMember[],
): ConventionRepresentative[] {
  function representativeForRole(
    roleName: "president" | "tresorier",
    defaultRole: string,
  ): ConventionRepresentative {
    const member = members.find((candidate) =>
      normalizeRole(candidate.role).includes(roleName),
    );
    return member
      ? {
          name: `${member.firstname} ${member.lastname.toLocaleUpperCase("fr-FR")}`,
          role: member.role,
        }
      : { name: "", role: defaultRole };
  }

  return [
    representativeForRole("president", "Président"),
    representativeForRole("tresorier", "Trésorier"),
  ];
}

/**
 * « Responsable de l'association » signataire d'un Ordre de financement :
 * présidence en priorité, sinon un rôle contenant « responsable ».
 */
export function responsibleNameFromMembers(members: ActiveMember[]): string {
  const member =
    members.find((candidate) =>
      normalizeRole(candidate.role).includes("president"),
    ) ??
    members.find((candidate) =>
      normalizeRole(candidate.role).includes("responsable"),
    );
  return member
    ? `${member.firstname} ${member.lastname.toLocaleUpperCase("fr-FR")}`
    : "";
}
