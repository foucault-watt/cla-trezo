"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  buildGrantDocumentPath,
  deleteStoredFile,
  writeStoredFile,
} from "@/lib/storage/file-storage";
import { getCampaignStatus } from "@/lib/subventions/status";
import { subsidyConventionPdfDataSchema } from "@/pdf-lab/templates/convention/schema";
import { financementPdfDataSchema } from "@/pdf-lab/templates/financement/schema";
import { grantDocumentTotal } from "./grant-document-total";
import { grantDocumentKindForAssoType } from "./grant-documents";
import {
  renderConventionPdf,
  renderOrdreDeFinancementPdf,
} from "./render-grant-document";
import { formatConventionDate } from "./subsidy-convention";

export type GenerateGrantDocumentState =
  { ok: true; documentId: string } | { ok: false; error: string };

const INVALID_DATA_ERROR = "Les données du document sont invalides.";
const GENERATION_FAILED_ERROR = "La génération du document a échoué.";
const UNREADABLE_AMOUNT_ERROR =
  "Un montant de ligne est illisible : corrigez-le avant de générer le document.";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Génère (ou régénère) le Document d'octroi d'une Structure pour une
 * Campagne publiée (ADR-0007) : le type de document est déduit du type de
 * la Structure, jamais du client, et le total est recalculé depuis les
 * lignes envoyées (cf. grant-document-total.ts) plutôt que repris tel quel. Le nouveau fichier est écrit avant de
 * mettre à jour l'enregistrement, et l'ancien fichier n'est supprimé
 * qu'ensuite — un échec ne laisse jamais un enregistrement sans fichier.
 */
export async function generateGrantDocumentAction(
  campaignId: string,
  assoId: string,
  data: unknown,
): Promise<GenerateGrantDocumentState> {
  await requireAdmin();

  const [campaign, asso] = await Promise.all([
    prisma.subventionCampaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        publicationDate: true,
        subventions: { where: { assoId }, select: { id: true } },
        grantDocuments: {
          where: { assoId },
          select: { id: true, filePath: true },
        },
      },
    }),
    prisma.asso.findUnique({
      where: { id: assoId },
      select: { id: true, slug: true, type: true },
    }),
  ]);
  if (!campaign || !asso) {
    return { ok: false, error: "Campagne ou Structure introuvable." };
  }
  if (getCampaignStatus(campaign.publicationDate) !== "PUBLIEE") {
    return {
      ok: false,
      error: "La Campagne doit être publiée avant de générer le document.",
    };
  }
  if (campaign.subventions.length === 0) {
    return {
      ok: false,
      error: "Cette Structure n'a aucune Subvention dans la Campagne.",
    };
  }

  const kind = grantDocumentKindForAssoType(asso.type);
  if (!kind) {
    return {
      ok: false,
      error:
        "Le type de la Structure n'est pas renseigné : classez-la avant de générer le document.",
    };
  }

  let render: () => Promise<Buffer>;
  if (kind === "CONVENTION") {
    const submitted = asRecord(data);
    const secondParty = asRecord(submitted.secondParty);
    if (!String(secondParty.address ?? "").trim()) {
      return {
        ok: false,
        error: "Renseignez l'adresse du siège de l'association bénéficiaire.",
      };
    }
    const signatureDate = formatConventionDate(new Date());
    const parsed = subsidyConventionPdfDataSchema.safeParse({
      ...submitted,
      firstPartySignature: {
        ...asRecord(submitted.firstPartySignature),
        date: signatureDate,
      },
      secondPartySignature: {
        ...asRecord(submitted.secondPartySignature),
        date: signatureDate,
      },
    });
    if (!parsed.success) return { ok: false, error: INVALID_DATA_ERROR };
    const totalAmount = grantDocumentTotal(parsed.data.expenses);
    if (!totalAmount) return { ok: false, error: UNREADABLE_AMOUNT_ERROR };
    render = () => renderConventionPdf({ ...parsed.data, totalAmount });
  } else {
    const parsed = financementPdfDataSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: INVALID_DATA_ERROR };
    const total = grantDocumentTotal(parsed.data.expenses);
    if (!total) return { ok: false, error: UNREADABLE_AMOUNT_ERROR };
    render = () => renderOrdreDeFinancementPdf({ ...parsed.data, total });
  }

  const generatedAt = new Date();
  const filePath = buildGrantDocumentPath({
    assoSlug: asso.slug,
    campaignId: campaign.id,
    now: generatedAt,
  });
  try {
    await writeStoredFile(filePath, await render());
  } catch (error) {
    console.error("Grant document PDF generation failed", error);
    await deleteStoredFile(filePath).catch(() => undefined);
    return { ok: false, error: GENERATION_FAILED_ERROR };
  }

  const record = {
    kind,
    filePath,
    generatedAt,
    subventionCount: campaign.subventions.length,
  };
  let documentId: string;
  try {
    const document = await prisma.grantDocument.upsert({
      where: {
        campaignId_assoId: { campaignId: campaign.id, assoId: asso.id },
      },
      create: { campaignId: campaign.id, assoId: asso.id, ...record },
      update: record,
      select: { id: true },
    });
    documentId = document.id;
  } catch (error) {
    console.error("Grant document record failed", error);
    await deleteStoredFile(filePath).catch(() => undefined);
    return { ok: false, error: GENERATION_FAILED_ERROR };
  }

  const previousPath = campaign.grantDocuments[0]?.filePath;
  if (previousPath && previousPath !== filePath) {
    await deleteStoredFile(previousPath).catch(() => undefined);
  }

  revalidatePath(`/app/admin/subventions/${campaign.id}`);
  revalidatePath(`/app/${asso.slug}/subventions`);

  return { ok: true, documentId };
}
