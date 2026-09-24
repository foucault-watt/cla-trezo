"use client";

import { RouteError } from "@/components/ui/route-error";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <RouteError
      error={error}
      retry={retry}
      homeHref="/"
      homeLabel="Retour à l'accueil"
      fullPage
    />
  );
}
