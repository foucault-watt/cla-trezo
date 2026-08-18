import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/money";
import type {
  ConventionRepresentative,
  SubsidyConventionPdfData,
} from "@/pdf-lab/templates/convention/types";
import { getConventionPdfSettings } from "./convention-pdf-settings";

const PARIS_TIME_ZONE = "Europe/Paris";

function parisDateParts(date: Date) {
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

export type ConventionPreparation = {
  campaignId: string;
  campaignName: string;
  assoId: string;
  assoName: string;
  publicationDate: Date | null;
  data: SubsidyConventionPdfData;
};

export async function getConventionPreparation(
  campaignId: string,
  assoId: string,
): Promise<ConventionPreparation | null> {
  const [campaign, settings] = await Promise.all([
    prisma.subventionCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        publicationDate: true,
        subventions: {
          where: { assoId },
          orderBy: { createdAt: "asc" },
          select: {
            reason: true,
            amountCents: true,
            asso: {
              select: {
                id: true,
                name: true,
                memberships: {
                  where: { isActive: true },
                  select: {
                    role: true,
                    user: { select: { firstname: true, lastname: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    getConventionPdfSettings(),
  ]);

  const firstLine = campaign?.subventions[0];
  if (!campaign || !firstLine) return null;

  const publicationDate = campaign.publicationDate;
  const generatedOn = new Date();
  const signatureDate = formatConventionDate(generatedOn);
  const representatives = beneficiaryRepresentativesFromMembers(
    firstLine.asso.memberships.map((membership) => ({
      ...membership.user,
      role: membership.role,
    })),
  );
  const totalAmountCents = campaign.subventions.reduce(
    (total, line) => total + line.amountCents,
    0,
  );

  return {
    campaignId: campaign.id,
    campaignName: campaign.name,
    assoId: firstLine.asso.id,
    assoName: firstLine.asso.name,
    publicationDate,
    data: {
      period: publicationDate
        ? conventionPeriodForPublicationDate(publicationDate)
        : "",
      firstParty: {
        associationName: settings.claAssociationName,
        address: settings.claAddress,
        representatives: settings.claRepresentatives,
      },
      secondParty: {
        associationName: firstLine.asso.name,
        address: settings.claAddress,
        representatives,
      },
      expenses: campaign.subventions.map((line) => ({
        grantedOn: publicationDate ? formatConventionDate(publicationDate) : "",
        description: line.reason,
        amount: formatCents(line.amountCents),
      })),
      totalAmount: formatCents(totalAmountCents),
      firstPartySignature: {
        associationName: settings.claAssociationName,
        signatoryName: settings.claSignatoryName,
        signatoryRole: settings.claSignatoryRole,
        city: settings.claSignatureCity,
        date: signatureDate,
      },
      secondPartySignature: {
        associationName: firstLine.asso.name,
        signatoryName: "",
        signatoryRole: "",
        city: "",
        date: signatureDate,
      },
    },
  };
}

export async function requireConventionPreparation(
  campaignId: string,
  assoId: string,
) {
  const preparation = await getConventionPreparation(campaignId, assoId);
  if (!preparation) notFound();
  return preparation;
}
