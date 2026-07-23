"use client";

import { List, LayoutGrid } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ViewToggle({ current }: { current: "list" | "grid" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(view: "list" | "grid") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="join">
      <button
        className={`btn btn-sm join-item ${current === "list" ? "btn-active" : ""}`}
        aria-pressed={current === "list"}
        onClick={() => setView("list")}
      >
        <List size={16} />
        Liste
      </button>
      <button
        className={`btn btn-sm join-item ${current === "grid" ? "btn-active" : ""}`}
        aria-pressed={current === "grid"}
        onClick={() => setView("grid")}
      >
        <LayoutGrid size={16} />
        Grille
      </button>
    </div>
  );
}
