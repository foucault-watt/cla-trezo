"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

const CLICKS_NEEDED = 5;
const WINDOW_MS = 2000;

/**
 * Titre de la page qui sert d'entrée cachée vers /app/admin/stats : cinq
 * clics en moins de deux secondes. Les statistiques ne figurent dans aucune
 * navigation (décision CLA) ; ce raccourci évite de retenir l'URL. L'accès
 * reste protégé par le contrôle Admin de la page cible.
 */
export function SecretStatsTitle({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const clicks = useRef<number[]>([]);

  function handleClick() {
    const now = Date.now();
    clicks.current = [
      ...clicks.current.filter((time) => now - time < WINDOW_MS),
      now,
    ];
    if (clicks.current.length >= CLICKS_NEEDED) {
      clicks.current = [];
      router.push("/app/admin/stats");
    }
  }

  return (
    <h1 className="text-2xl font-semibold select-none" onClick={handleClick}>
      {children}
    </h1>
  );
}
