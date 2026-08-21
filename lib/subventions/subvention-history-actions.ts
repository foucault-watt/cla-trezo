"use server";

import {
  listHistoricalSubventions,
  type VisibleSubvention,
} from "./visible-subventions";

/**
 * Chargement à la demande de l'historique (section repliée par défaut de la
 * page /subventions) — cf. lib/subventions/visible-subventions.ts.
 */
export async function listHistoricalSubventionsAction(
  assoSlug: string,
): Promise<VisibleSubvention[]> {
  return listHistoricalSubventions(assoSlug);
}
