"use client";

import { useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export function AssoSelect({
  assos,
  value,
  onChange,
}: {
  assos: { id: string; name: string }[];
  value: string;
  onChange: (id: string, name: string) => void;
}) {
  const anchorId = `asso-select-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const popoverId = `${anchorId}-popover`;
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const selected = assos.find((asso) => asso.id === value);
  const filtered = assos.filter((asso) =>
    asso.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <>
      <button
        type="button"
        popoverTarget={popoverId}
        id={anchorId}
        style={{ anchorName: `--${anchorId}` } as React.CSSProperties}
        className="btn btn-sm w-full justify-between font-normal"
      >
        <span className={selected ? "" : "text-base-content/50"}>
          {selected?.name ?? "Choisir une Asso"}
        </span>
        <ChevronDown size={14} className="text-base-content/50" />
      </button>
      {/* Popover natif : rendu dans la top layer, il passe par-dessus le
          tableau au lieu d'être rogné par son `overflow` (et d'y créer un
          scroll). */}
      <div
        ref={popoverRef}
        popover="auto"
        id={popoverId}
        className="dropdown w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
        style={{ positionAnchor: `--${anchorId}` } as React.CSSProperties}
        onToggle={(event) => {
          if (event.newState === "open") {
            searchRef.current?.focus();
          } else {
            setQuery("");
          }
        }}
      >
        <input
          ref={searchRef}
          type="text"
          placeholder="Rechercher une Asso…"
          className="input input-sm w-full"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              const first = filtered[0];
              if (first) {
                onChange(first.id, first.name);
                popoverRef.current?.hidePopover();
              }
            }
          }}
        />
        <ul className="mt-1 flex max-h-56 flex-col overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="px-2 py-1.5 text-sm text-base-content/60">
              Aucune Asso
            </li>
          ) : (
            filtered.map((asso) => (
              <li key={asso.id}>
                <button
                  type="button"
                  className={`w-full rounded-field px-2 py-1.5 text-left text-sm hover:bg-base-200 ${
                    asso.id === value ? "bg-base-200 font-medium" : ""
                  }`}
                  onClick={() => {
                    onChange(asso.id, asso.name);
                    popoverRef.current?.hidePopover();
                  }}
                >
                  {asso.name}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}
