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
      homeHref="/app/admin"
      homeLabel="Retour au Dashboard"
    />
  );
}
