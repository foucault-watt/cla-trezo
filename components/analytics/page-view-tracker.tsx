"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ENDPOINT = "/api/analytics/page-view";

/**
 * Signale chaque page de l'app connectée au serveur (cf.
 * app/api/analytics/page-view/route.ts), qui décide seul de l'enregistrer.
 * Le chemin seul, sans requête : elle peut porter un message de toast.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith("/app")) return;
    const body = JSON.stringify({ path: pathname });
    const sent =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon(
        ENDPOINT,
        new Blob([body], { type: "application/json" }),
      );
    if (!sent) {
      void fetch(ENDPOINT, {
        method: "POST",
        body,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
