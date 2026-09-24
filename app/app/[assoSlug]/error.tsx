"use client";

import { useParams } from "next/navigation";
import { RouteError } from "@/components/ui/route-error";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { assoSlug } = useParams<{ assoSlug: string }>();

  return (
    <RouteError
      error={error}
      retry={retry}
      homeHref={`/app/${assoSlug}`}
      homeLabel="Retour au Dashboard"
    />
  );
}
