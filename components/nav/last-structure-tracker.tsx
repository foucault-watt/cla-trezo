"use client";

import { useEffect } from "react";

export const LAST_STRUCTURE_SLUG_KEY = "cla:last-structure-slug";

// Mémorise en local (pas en base) la dernière structure visitée par
// l'utilisateur, pour que le bouton "Mode application" de l'admin puisse
// y ramener directement au lieu de repasser par le sélecteur.
export function LastStructureTracker({ assoSlug }: { assoSlug: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(LAST_STRUCTURE_SLUG_KEY, assoSlug);
    } catch {
      // localStorage indisponible (navigation privée, quota...) : tant pis.
    }
  }, [assoSlug]);

  return null;
}
