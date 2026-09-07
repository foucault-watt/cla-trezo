"use client";

import { SoldeMovementRow } from "@/components/solde/solde-movement-row";
import type { YearGroup } from "@/lib/dashboard/dashboard-overview";
import type { SoldeMovement } from "@/lib/solde/solde";
import { useOpenGroups } from "./use-open-groups";

export function SoldeHistoryAccordion({
  groups,
}: {
  groups: YearGroup<SoldeMovement>[];
}) {
  const { openKeys, toggle } = useOpenGroups(groups);

  if (groups.length === 0) {
    return <p className="text-base-content/70">Aucun mouvement.</p>;
  }

  return (
    <div className="join join-vertical w-full">
      {groups.map((group) => {
        const isOpen = openKeys.has(group.key);
        return (
          <div
            key={group.key}
            className="collapse-arrow join-item collapse border border-base-300 bg-base-100"
          >
            <input
              type="checkbox"
              checked={isOpen}
              onChange={() => toggle(group.key)}
              aria-label={`Basculer l'année ${group.label}`}
            />
            <div className="collapse-title text-sm font-medium">
              {group.label}
              <span className="ml-2 text-xs font-normal text-base-content/50">
                {group.items.length} mouvement
                {group.items.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="collapse-content">
              <ul className="flex flex-col">
                {group.items.map((m) => (
                  <li key={m.id}>
                    <SoldeMovementRow movement={m} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
