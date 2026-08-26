"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast, type ToastType } from "./toast";

const VALID_TYPES: ToastType[] = ["success", "error", "info", "warning"];

/**
 * Affiche un toast au chargement d'une page si l'URL porte `?toast=<message>`
 * (et optionnellement `&toastType=success|error|info|warning`, défaut
 * "success"), puis nettoie ces deux paramètres de l'URL sans toucher aux
 * autres. Sert à faire survivre un toast à une redirection côté serveur
 * (`redirect()` dans une Server Action, où aucun code client ne peut
 * s'exécuter entre l'action et la navigation). Voir docs/agents/toasts.md.
 *
 * Monté une seule fois dans app/layout.tsx (dans un <Suspense>, requis par
 * useSearchParams) — n'importe quel redirect() du site peut déclencher un
 * toast simplement en ajoutant ces paramètres à son URL cible.
 */
export function ToastQueryFlag() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { push } = useToast();

  useEffect(() => {
    const message = searchParams.get("toast");
    if (!message) return;

    const rawType = searchParams.get("toastType");
    const type: ToastType = VALID_TYPES.includes(rawType as ToastType)
      ? (rawType as ToastType)
      : "success";
    push({ type, message });

    const next = new URLSearchParams(searchParams);
    next.delete("toast");
    next.delete("toastType");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
    // Ne dépend que de searchParams : push/router/pathname sont stables ou
    // ne doivent pas re-déclencher ce nettoyage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
