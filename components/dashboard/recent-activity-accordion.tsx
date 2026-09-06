"use client";

import type {
  DashboardActivity,
  YearGroup,
} from "@/lib/dashboard/dashboard-overview";
import { useOpenGroups } from "./use-open-groups";

const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

export function RecentActivityAccordion({
  groups,
}: {
  groups: YearGroup<DashboardActivity>[];
}) {
  const { openKeys, toggle } = useOpenGroups(groups);

  if (groups.length === 0) {
    return (
      <p className="text-base-content/70">
        Aucune activité pour l&apos;instant.
      </p>
    );
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
                {group.items.length} événement
                {group.items.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="collapse-content">
              <ul className="flex flex-col">
                {group.items.map((a) => (
                  <li
                    key={a.id}
                    className="grid grid-cols-[3.5rem_1fr] items-start gap-x-3 py-1.5"
                  >
                    <span className="pt-0.5 text-xs whitespace-nowrap text-base-content/50">
                      {dayFormat.format(a.date)}
                    </span>
                    <span className="text-sm">
                      {a.label}
                      <span className="ml-2 text-xs text-base-content/60">
                        {a.detail}
                      </span>
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
