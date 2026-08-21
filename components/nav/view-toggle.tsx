"use client";

import { List, LayoutGrid } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ViewToggle({
  current,
}: {
  current: "list" | "grid" | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(view: "list" | "grid") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const selected = "bg-base-100 text-base-content shadow-sm";
  const unselected = "bg-base-300 text-base-content/60 hover:text-base-content";

  return (
    <div className="join">
      <button
        className={`btn btn-sm join-item border-none ${current === "list" ? selected : unselected}`}
        aria-pressed={current === "list"}
        onClick={() => setView("list")}
      >
        <List size={16} />
        Liste
      </button>
      <button
        className={`btn btn-sm join-item border-none ${current === "grid" ? selected : unselected}`}
        aria-pressed={current === "grid"}
        onClick={() => setView("grid")}
      >
        <LayoutGrid size={16} />
        Grille
      </button>
    </div>
  );
}
