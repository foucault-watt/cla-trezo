"use client";

import { useState } from "react";
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
  const [query, setQuery] = useState("");
  const selected = assos.find((asso) => asso.id === value);
  const filtered = assos.filter((asso) =>
    asso.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="dropdown">
      <button
        type="button"
        tabIndex={0}
        className="btn btn-sm w-full justify-between font-normal"
      >
        <span className={selected ? "" : "text-base-content/50"}>
          {selected?.name ?? "Choisir une Asso"}
        </span>
        <ChevronDown size={14} className="text-base-content/50" />
      </button>
      <div
        tabIndex={0}
        className="dropdown-content z-10 mt-2 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
      >
        <input
          type="text"
          autoFocus
          placeholder="Rechercher une Asso…"
          className="input input-sm w-full"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
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
                  onClick={(event) => {
                    onChange(asso.id, asso.name);
                    setQuery("");
                    event.currentTarget.blur();
                  }}
                >
                  {asso.name}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
