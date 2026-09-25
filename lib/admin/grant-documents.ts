import { notFound } from "next/navigation";
import type { AssoType, GrantDocumentKind } from "@/app/generated/prisma/enums";
import { formatCentsForPdf } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import type { SubsidyConventionPdfData } from "@/pdf-lab/templates/convention/types";
import type { FinancementPdfData } from "@/pdf-lab/templates/financement/types";
import type { ConventionPdfSettingsInput } from "./convention-pdf-settings-input";
import { getConventionPdfSettings } from "./convention-pdf-settings";
import {
  beneficiaryRepresentativesFromMembers,
  conventionPeriodForPublicationDate,
  formatConventionDate,
  parisDateParts,
  responsibleNameFromMembers,
} from "./subsidy-convention";

/**
 * Type de Document d'octroi selon le type de la Structure (ADR-0007) :
 * `null` tant que la Structure n'est pas classée — la génération est alors
 * bloquée plutôt que d'émettre le mauvais document.
 */
export function grantDocumentKindForAssoType(
  type: AssoType | null,
): GrantDocumentKind | null {
  switch (type) {
    case "ASSOCIATION_1901":
      return "CONVENTION";
    case "CLUB":
    case "COMMISSION":
      return "ORDRE_DE_FINANCEMENT";
    default:
      return null;
  }
}

export const grantDocumentKindLabels: Record<GrantDocumentKind, string> = {
  CONVENTION: "Convention de subvention",
  ORDRE_DE_FINANCEMENT: "Ordre de financement",
};

/**
 * Date limite d'utilisation d'un Ordre de financement : date de génération
 * + 1 an, en date civile de Paris. Un 29 février devient le 28 février.
 */
export function usageDeadlineFromGenerationDate(generatedOn: Date): string {
  const { year, month, day } = parisDateParts(generatedOn);
  const nextYear = year + 1;
  const lastDayOfMonth = new Date(Date.UTC(nextYear, month, 0)).getUTCDate();
  const deadlineDay = Math.min(day, lastDayOfMonth);
  return `${String(deadlineDay).padStart(2, "0")}/${String(month).padStart(2, "0")}/${nextYear}`;
}

export function ordreDeFinancementStatus(type: "CLUB" | "COMMISSION"): string {
  return type === "CLUB" ? "Club" : "Commission";
}

export function requestContextForCampaign(campaignName: string): string {
  return `financement lors du ${campaignName}`;
}

type PreparationSubvention = { reason: string; amountCents: number };

type ActiveMember = { firstname: string; lastname: string; role: string };

type PreparationSource = {
  campaignName: string;
  publicationDate: Date | null;
  assoName: string;
  subventions: PreparationSubvention[];
  members: ActiveMember[];
  settings: ConventionPdfSettingsInput;
  generatedOn: Date;
};

function totalAmountCents(subventions: readonly { amountCents: number }[]) {
  return subventions.reduce((total, line) => total + line.amountCents, 0);
}

export function buildConventionData({
  publicationDate,
  assoName,
  subventions,
  members,
  settings,
  generatedOn,
}: PreparationSource): SubsidyConventionPdfData {
  const signatureDate = formatConventionDate(generatedOn);
  const grantedOn = publicationDate
    ? formatConventionDate(publicationDate)
    : "";

  return {
    period: publicationDate
      ? conventionPeriodForPublicationDate(publicationDate)
      : "",
    firstParty: {
      associationName: settings.claAssociationName,
      address: settings.claAddress,
      representatives: settings.claRepresentatives,
    },
    // L'adresse du bénéficiaire est saisie à chaque Convention : jamais
    // préremplie avec celle de CLA.
    secondParty: {
      associationName: assoName,
      address: "",
      representatives: beneficiaryRepresentativesFromMembers(members),
    },
    expenses: subventions.map((line) => ({
      grantedOn,
      description: line.reason,
      amount: formatCentsForPdf(line.amountCents),
    })),
    totalAmount: formatCentsForPdf(totalAmountCents(subventions)),
    firstPartySignature: {
      associationName: settings.claAssociationName,
      signatoryName: settings.claSignatoryName,
      signatoryRole: settings.claSignatoryRole,
      city: settings.claSignatureCity,
      date: signatureDate,
    },
    secondPartySignature: {
      associationName: assoName,
      signatoryName: "",
      signatoryRole: "",
      city: "",
      date: signatureDate,
    },
  };
}

export function buildOrdreDeFinancementData({
  assoType,
  campaignName,
  publicationDate,
  assoName,
  subventions,
  members,
  settings,
  generatedOn,
}: PreparationSource & {
  assoType: "CLUB" | "COMMISSION";
}): FinancementPdfData {
  const grantedOn = publicationDate
    ? formatConventionDate(publicationDate)
    : "";

  return {
    period: publicationDate
      ? conventionPeriodForPublicationDate(publicationDate)
      : "",
    associationName: assoName,
    associationStatus: ordreDeFinancementStatus(assoType),
    requestContext: requestContextForCampaign(campaignName),
    expenses: subventions.map((line) => ({
      date: grantedOn,
      description: line.reason,
      amount: formatCentsForPdf(line.amountCents),
    })),
    total: formatCentsForPdf(totalAmountCents(subventions)),
    usageDeadline: usageDeadlineFromGenerationDate(generatedOn),
    responsibleName: responsibleNameFromMembers(members),
    secretaryName: settings.claSignatoryName,
  };
}

/**
 * Un Document d'octroi est à régénérer quand ses Subventions ont changé
 * depuis sa génération (ajout ou modification : `updatedAt` postérieur ;
 * suppression : nombre différent) ou quand le type de la Structure ne
 * correspond plus au type de document.
 */
export function isGrantDocumentStale(
  document: {
    kind: GrantDocumentKind;
    generatedAt: Date;
    subventionCount: number;
  },
  current: {
    kind: GrantDocumentKind | null;
    subventions: { updatedAt: Date }[];
  },
): boolean {
  return (
    document.kind !== current.kind ||
    document.subventionCount !== current.subventions.length ||
    current.subventions.some(
      (subvention) => subvention.updatedAt > document.generatedAt,
    )
  );
}

type PreparationBase = {
  campaignId: string;
  campaignName: string;
  assoId: string;
  assoSlug: string;
  assoName: string;
  publicationDate: Date | null;
  existingDocument: { generatedAt: Date } | null;
};

export type GrantDocumentPreparation = PreparationBase &
  (
    | { kind: null }
    | { kind: "CONVENTION"; data: SubsidyConventionPdfData }
    | { kind: "ORDRE_DE_FINANCEMENT"; data: FinancementPdfData }
  );

export async function getGrantDocumentPreparation(
  campaignId: string,
  assoId: string,
  generatedOn = new Date(),
): Promise<GrantDocumentPreparation | null> {
  const [campaign, asso, settings] = await Promise.all([
    prisma.subventionCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        publicationDate: true,
        subventions: {
          where: { assoId },
          orderBy: { createdAt: "asc" },
          select: { reason: true, amountCents: true },
        },
        grantDocuments: {
          where: { assoId },
          select: { generatedAt: true },
        },
      },
    }),
    prisma.asso.findUnique({
      where: { id: assoId },
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
        memberships: {
          select: {
            role: true,
            user: { select: { firstname: true, lastname: true } },
          },
        },
      },
    }),
    getConventionPdfSettings(),
  ]);

  if (!campaign || !asso || campaign.subventions.length === 0) return null;

  const base: PreparationBase = {
    campaignId: campaign.id,
    campaignName: campaign.name,
    assoId: asso.id,
    assoSlug: asso.slug,
    assoName: asso.name,
    publicationDate: campaign.publicationDate,
    existingDocument: campaign.grantDocuments[0] ?? null,
  };
  const source: PreparationSource = {
    campaignName: campaign.name,
    publicationDate: campaign.publicationDate,
    assoName: asso.name,
    subventions: campaign.subventions,
    members: asso.memberships.map((membership) => ({
      ...membership.user,
      role: membership.role,
    })),
    settings,
    generatedOn,
  };

  if (asso.type === "ASSOCIATION_1901") {
    return { ...base, kind: "CONVENTION", data: buildConventionData(source) };
  }
  if (asso.type === "CLUB" || asso.type === "COMMISSION") {
    return {
      ...base,
      kind: "ORDRE_DE_FINANCEMENT",
      data: buildOrdreDeFinancementData({ ...source, assoType: asso.type }),
    };
  }
  return { ...base, kind: null };
}

export async function requireGrantDocumentPreparation(
  campaignId: string,
  assoId: string,
) {
  const preparation = await getGrantDocumentPreparation(campaignId, assoId);
  if (!preparation) notFound();
  return preparation;
}

export type GrantDocumentRow = {
  assoId: string;
  assoName: string;
  assoSlug: string;
  kind: GrantDocumentKind | null;
  subventionCount: number;
  totalAmountCents: number;
  document: { generatedAt: Date; stale: boolean } | null;
};

/**
 * Une ligne par Structure bénéficiaire d'une Campagne, triée par nom : ses
 * Subventions (nombre, total), le type de Document d'octroi attendu (null si
 * Structure non classée) et le document généré, avec son éventuel besoin de
 * régénération. Tout est lu en base à chaque rendu : après un ajout, une
 * modification ou une suppression de Subvention, la liste reflète toujours
 * l'état réel (cf. revalidatePath dans subvention-actions.ts).
 */
export async function listGrantDocumentRows(
  campaignId: string,
): Promise<GrantDocumentRow[]> {
  const [subventions, documents] = await Promise.all([
    prisma.subvention.findMany({
      where: { campaignId },
      select: {
        amountCents: true,
        updatedAt: true,
        asso: { select: { id: true, name: true, slug: true, type: true } },
      },
    }),
    prisma.grantDocument.findMany({
      where: { campaignId },
      select: {
        assoId: true,
        kind: true,
        generatedAt: true,
        subventionCount: true,
      },
    }),
  ]);

  const byAsso = new Map<
    string,
    {
      asso: { id: string; name: string; slug: string; type: AssoType | null };
      subventions: { amountCents: number; updatedAt: Date }[];
    }
  >();
  for (const { asso, ...subvention } of subventions) {
    const current = byAsso.get(asso.id) ?? { asso, subventions: [] };
    current.subventions.push(subvention);
    byAsso.set(asso.id, current);
  }

  return Array.from(byAsso.values(), ({ asso, subventions }) => {
    const kind = grantDocumentKindForAssoType(asso.type);
    const document = documents.find((item) => item.assoId === asso.id);
    return {
      assoId: asso.id,
      assoName: asso.name,
      assoSlug: asso.slug,
      kind,
      subventionCount: subventions.length,
      totalAmountCents: totalAmountCents(subventions),
      document: document
        ? {
            generatedAt: document.generatedAt,
            stale: isGrantDocumentStale(document, { kind, subventions }),
          }
        : null,
    };
  }).sort((a, b) => a.assoName.localeCompare(b.assoName, "fr"));
}
