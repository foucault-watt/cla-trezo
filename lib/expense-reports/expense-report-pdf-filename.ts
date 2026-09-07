import type { FundingSourceType } from "@/app/generated/prisma/enums";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "") // enlève les accents (é -> e, ...)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/**
 * Nom de fichier proposé au téléchargement d'un PDF final (issue #20),
 * partagé par les routes Structure et Admin. Pure : ne dépend que des champs
 * déjà chargés par l'appelant, jamais de Prisma directement.
 *
 * Inclut le nom du bénéficiaire pour rester lisible une fois téléchargé hors
 * contexte (plusieurs PDF "note-de-frais-solde.pdf" s'écrasent sinon dans le
 * dossier de téléchargements).
 */
export function buildExpenseReportPdfFilename(pdf: {
  fundingSource: FundingSourceType;
  subvention: { reason: string } | null;
  expenseReport: {
    beneficiaryFirstname: string | null;
    beneficiaryLastname: string | null;
  };
}): string {
  const beneficiarySlug = slugify(
    `${pdf.expenseReport.beneficiaryFirstname ?? ""} ${pdf.expenseReport.beneficiaryLastname ?? ""}`,
  );
  const suffix = beneficiarySlug ? `-${beneficiarySlug}` : "";

  if (pdf.fundingSource === "CLUB_BALANCE") {
    return `note-de-frais-solde${suffix}.pdf`;
  }
  const reasonSlug = slugify(pdf.subvention?.reason ?? "subvention");
  return `note-de-frais-${reasonSlug || "subvention"}${suffix}.pdf`;
}
