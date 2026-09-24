import type { GrantDocumentKind } from "@/app/generated/prisma/enums";
import { requireStructureAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export type StructureGrantDocument = {
  id: string;
  kind: GrantDocumentKind;
  campaignName: string;
  generatedAt: Date;
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/**
 * Nom de fichier proposé au téléchargement d'un Document d'octroi, partagé
 * par les routes Structure et Admin.
 */
export function buildGrantDocumentFilename(document: {
  kind: GrantDocumentKind;
  campaignName: string;
  assoName: string;
}): string {
  const prefix =
    document.kind === "CONVENTION"
      ? "convention-de-subvention"
      : "ordre-de-financement";
  const parts = [
    prefix,
    slugify(document.assoName),
    slugify(document.campaignName),
  ];
  return `${parts.filter(Boolean).join("-")}.pdf`;
}

/**
 * Documents d'octroi d'une Structure, du plus récent au plus ancien. Seules
 * les Campagnes publiées sont visibles côté Structure (cf. CONTEXT.md).
 */
export async function listGrantDocumentsForAsso(
  assoId: string,
  now: Date = new Date(),
): Promise<StructureGrantDocument[]> {
  const documents = await prisma.grantDocument.findMany({
    where: { assoId, campaign: { publicationDate: { not: null, lte: now } } },
    orderBy: { generatedAt: "desc" },
    select: {
      id: true,
      kind: true,
      generatedAt: true,
      campaign: { select: { name: true } },
    },
  });

  return documents.map((document) => ({
    id: document.id,
    kind: document.kind,
    campaignName: document.campaign.name,
    generatedAt: document.generatedAt,
  }));
}

/**
 * Document d'octroi à servir à une Structure : `null` s'il n'existe pas, s'il
 * appartient à une autre Structure ou si sa Campagne n'est pas publiée —
 * jamais de distinction entre ces cas côté réponse (404).
 */
export async function findGrantDocumentForAsso(
  documentId: string,
  assoId: string,
  now: Date = new Date(),
): Promise<{ filePath: string; filename: string } | null> {
  const document = await prisma.grantDocument.findUnique({
    where: { id: documentId },
    select: {
      assoId: true,
      kind: true,
      filePath: true,
      asso: { select: { name: true } },
      campaign: { select: { name: true, publicationDate: true } },
    },
  });
  if (
    !document ||
    document.assoId !== assoId ||
    !document.campaign.publicationDate ||
    document.campaign.publicationDate > now
  ) {
    return null;
  }

  return {
    filePath: document.filePath,
    filename: buildGrantDocumentFilename({
      kind: document.kind,
      campaignName: document.campaign.name,
      assoName: document.asso.name,
    }),
  };
}

export async function listStructureGrantDocuments(
  assoSlug: string,
): Promise<StructureGrantDocument[]> {
  const { structure } = await requireStructureAccess(assoSlug);
  return listGrantDocumentsForAsso(structure.assoId);
}
