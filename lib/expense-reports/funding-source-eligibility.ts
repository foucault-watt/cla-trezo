import type { AssoType, FundingSourceType } from "@/app/generated/prisma/enums";
import { assoHasSolde } from "@/lib/solde/solde";

export type FundingSourceEligibilityInput =
  | { fundingSource: Extract<FundingSourceType, "CLUB_BALANCE">; assoType: AssoType | null }
  | {
      fundingSource: Extract<FundingSourceType, "SUBVENTION">;
      assoId: string;
      subvention: { assoId: string; campaignPublicationDate: Date | null } | null;
      now: Date;
    };

export type FundingSourceEligibilityResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Vérifie la règle T11 : Solde réservé aux Clubs, Subvention réservée à une
 * Structure destinataire dont la Campagne est Publiée. Fonction pure : les
 * données (type de la Structure, Subvention candidate) sont déjà chargées par
 * l'appelant, qui garde la responsabilité des requêtes Prisma (cf. issue #29).
 */
export function checkFundingSourceEligibility(
  input: FundingSourceEligibilityInput,
): FundingSourceEligibilityResult {
  if (input.fundingSource === "CLUB_BALANCE") {
    if (!assoHasSolde(input.assoType)) {
      return { ok: false, error: "Seuls les Clubs peuvent utiliser le Solde." };
    }
    return { ok: true };
  }

  const { assoId, subvention, now } = input;
  if (
    !subvention ||
    subvention.assoId !== assoId ||
    !subvention.campaignPublicationDate ||
    subvention.campaignPublicationDate > now
  ) {
    return { ok: false, error: "Subvention introuvable ou non publiée." };
  }
  return { ok: true };
}
