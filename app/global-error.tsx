"use client";

import { RouteError } from "@/components/ui/route-error";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col">
        <title>CLA - Trézo</title>
        <RouteError
          error={error}
          retry={retry}
          homeHref="/"
          homeLabel="Retour à l'accueil"
          fullPage
        />
      </body>
    </html>
  );
}
