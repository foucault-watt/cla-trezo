"use client";

import { ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { LAST_STRUCTURE_SLUG_KEY } from "./last-structure-tracker";

// Ramène vers la dernière structure visitée (mémorisée en local) plutôt que
// vers le sélecteur de structures, quand on quitte la vue admin.
export function BackToAppLink() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        let lastSlug: string | null = null;
        try {
          lastSlug = localStorage.getItem(LAST_STRUCTURE_SLUG_KEY);
        } catch {
          // ignore
        }
        router.push(lastSlug ? `/app/${lastSlug}` : "/app");
      }}
      className="btn btn-ghost btn-sm w-full justify-start gap-2"
    >
      <ArrowLeftRight size={18} />
      Mode application
    </button>
  );
}
