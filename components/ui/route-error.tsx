"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, RotateCcw, TriangleAlert } from "lucide-react";

export function RouteError({
  error,
  retry,
  homeHref,
  homeLabel,
  fullPage = false,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref: string;
  homeLabel: string;
  fullPage?: boolean;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 px-4 py-16 text-center ${
        fullPage ? "flex-1 bg-base-200" : ""
      }`}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-error/10 text-error">
        <TriangleAlert size={32} />
      </div>
      <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
      <p className="max-w-md text-sm text-base-content/70">
        La page n&apos;a pas pu être chargée. Réessayez dans un instant ; si le
        problème persiste, contactez l&apos;équipe CLA.
      </p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <button type="button" className="btn btn-primary" onClick={retry}>
          <RotateCcw size={16} />
          Réessayer
        </button>
        <Link href={homeHref} className="btn btn-ghost">
          <ArrowLeft size={16} />
          {homeLabel}
        </Link>
      </div>
      {error.digest && (
        <p className="text-xs text-base-content/40">
          Référence : {error.digest}
        </p>
      )}
    </div>
  );
}
