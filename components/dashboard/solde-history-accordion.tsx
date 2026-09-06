"use client";

import type { YearGroup } from "@/lib/dashboard/dashboard-overview";
import { formatCents } from "@/lib/money";
import type { SoldeMovement } from "@/lib/solde/solde";
import { useOpenGroups } from "./use-open-groups";

const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

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
                  <li
                    key={m.id}
                    className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-x-3 py-1.5"
                  >
                    <span className="pt-0.5 text-xs whitespace-nowrap text-base-content/50">
                      {dayFormat.format(m.createdAt)}
                    </span>
                    <span className="text-sm">
                      {m.description ?? m.category ?? "Mouvement"}
                    </span>
                    <span
                      className={`text-right text-sm font-medium tabular-nums ${m.movementType === "CREDIT" ? "text-success" : "text-error"}`}
                    >
                      {m.movementType === "CREDIT" ? "+" : "-"}
                      {formatCents(m.amountCents)}
                    </span>
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
