import type { FundingSourceType } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { checkFundingSourceEligibility } from "./funding-source-eligibility";

/**
 * Charge les données Prisma nécessaires à la règle T11 (type de la Structure
 * ou Subvention candidate selon la source choisie) puis délègue la décision
 * à la fonction pure checkFundingSourceEligibility (cf. issue #29). Partagé
 * par les Server Actions Structure (expense-report-actions.ts) et Admin
 * (lib/admin/expense-report-actions.ts, cf. #18) — même règle stricte des
 * deux côtés, l'Admin n'a pas de passe-droit sur T11.
 *
 * Vit hors d'un fichier "use server" : une fonction non-async exportée
 * (cf. rawLineFormValues ci-dessous) ferait échouer la contrainte Next.js
 * "un fichier 'use server' ne peut exporter que des fonctions async".
 */
export async function loadFundingSourceEligibility({
  assoId,
  fundingSource,
  subventionId,
}: {
  assoId: string;
  fundingSource: FundingSourceType;
  subventionId: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (fundingSource === "CLUB_BALANCE") {
    const asso = await prisma.asso.findUnique({
      where: { id: assoId },
      select: { type: true },
    });
    return checkFundingSourceEligibility({
      fundingSource,
      assoType: asso?.type ?? null,
    });
  }

  const subvention = await prisma.subvention.findUnique({
    where: { id: subventionId as string },
    select: { assoId: true, campaign: { select: { publicationDate: true } } },
  });
  return checkFundingSourceEligibility({
    assoId,
    fundingSource,
    subvention: subvention
      ? {
          assoId: subvention.assoId,
          campaignPublicationDate: subvention.campaign.publicationDate,
        }
      : null,
    now: new Date(),
  });
}

export type ExpenseReportLineFormValues = {
  expenseDate?: string;
  amount: string;
  expenseName: string;
  typeDepenseId: string;
  customLabel: string;
  fundingSource: string;
  subventionId: string;
};

/**
 * Valeurs brutes (non validées) resaisies telles quelles en cas d'échec, pour
 * que le formulaire puisse les réafficher au lieu de forcer une resaisie
 * complète après une erreur de validation.
 */
export function rawLineFormValues(
  formData: FormData,
): ExpenseReportLineFormValues {
  return {
    expenseDate: String(formData.get("expenseDate") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    expenseName: String(formData.get("expenseName") ?? ""),
    typeDepenseId: String(formData.get("typeDepenseId") ?? ""),
    customLabel: String(formData.get("customLabel") ?? ""),
    fundingSource: String(formData.get("fundingSource") ?? ""),
    subventionId: String(formData.get("subventionId") ?? ""),
  };
}

/**
 * Forme commune du retour des Server Actions d'ajout/modification d'une
 * Ligne, côté Structure (expense-report-actions.ts) comme côté Admin
 * (lib/admin/expense-report-actions.ts, cf. #18) : permet à ReimbursementsTable
 * (app/app/[assoSlug]/notes-de-frais/[reportId]/_components/) d'accepter l'une
 * ou l'autre action en prop sans dupliquer le composant par acteur.
 */
export type ExpenseReportLineFormState = {
  ok: boolean;
  error?: string;
  values?: ExpenseReportLineFormValues;
  warnings?: string[];
};

/** Forme commune du retour d'une Server Action de suppression de Ligne (Admin uniquement, cf. #18). */
export type ExpenseReportLineDeleteState = {
  ok: boolean;
  error?: string;
};
