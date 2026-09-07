import type { FundingSourceType } from "@/app/generated/prisma/enums";

/**
 * Nom de fichier proposé au téléchargement d'un PDF final (issue #20),
 * partagé par les routes Structure et Admin. Pure : ne dépend que des champs
 * déjà chargés par l'appelant, jamais de Prisma directement.
 */
export function buildExpenseReportPdfFilename(pdf: {
  fundingSource: FundingSourceType;
  subvention: { reason: string } | null;
}): string {
  if (pdf.fundingSource === "CLUB_BALANCE") {
    return "note-de-frais-solde.pdf";
  }
  const slug = (pdf.subvention?.reason ?? "subvention")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `note-de-frais-${slug || "subvention"}.pdf`;
}
