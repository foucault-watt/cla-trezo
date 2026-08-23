"use client";

import { useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { iconUsages, type IconUsage } from "./icon-usage-data";
import { iconProposals } from "./icon-usage-proposals-data";

type SortMode = "icon" | "text";

function getIconComponent(name: string): LucideIcon | null {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] ?? null;
}

function buildDuplicateSets(usages: IconUsage[]) {
  const textsByIcon = new Map<string, Set<string>>();
  const iconsByText = new Map<string, Set<string>>();

  for (const usage of usages) {
    if (!usage.visibleText) continue;

    if (!textsByIcon.has(usage.icon)) textsByIcon.set(usage.icon, new Set());
    textsByIcon.get(usage.icon)?.add(usage.visibleText);

    if (!iconsByText.has(usage.visibleText))
      iconsByText.set(usage.visibleText, new Set());
    iconsByText.get(usage.visibleText)?.add(usage.icon);
  }

  const inconsistentIcons = new Set(
    [...textsByIcon.entries()]
      .filter(([, texts]) => texts.size > 1)
      .map(([icon]) => icon),
  );
  const inconsistentTexts = new Set(
    [...iconsByText.entries()]
      .filter(([, icons]) => icons.size > 1)
      .map(([text]) => text),
  );

  return { inconsistentIcons, inconsistentTexts };
}

export function IconUsageTab() {
  const [sortMode, setSortMode] = useState<SortMode>("icon");

  const { inconsistentIcons, inconsistentTexts } = useMemo(
    () => buildDuplicateSets(iconUsages),
    [],
  );

  const sorted = useMemo(() => {
    const copy = [...iconUsages];
    if (sortMode === "icon") {
      copy.sort(
        (a, b) =>
          a.icon.localeCompare(b.icon) ||
          (a.visibleText ?? "").localeCompare(b.visibleText ?? ""),
      );
    } else {
      copy.sort(
        (a, b) =>
          (a.visibleText ?? "￿").localeCompare(b.visibleText ?? "￿") ||
          a.icon.localeCompare(b.icon),
      );
    }
    return copy;
  }, [sortMode]);

  return (
    <div className="space-y-4">
      <div className="max-w-3xl space-y-2 text-sm text-base-content/70">
        <p>
          Recensement de chaque usage d&apos;icône (lucide-react) dans le
          site : quel texte visible et/ou quel aria-label lui est associé, et
          où. Objectif : repérer les incohérences (même icône avec des textes
          différents, même texte avec des icônes différentes) et les icônes
          sans aucun label accessible.
        </p>
        <p>
          Cette liste est maintenue à la main dans le code (
          <code className="text-xs">icon-usage-data.ts</code>) — pas de scan
          automatique. Pensez à y ajouter une entrée à chaque icône
          ajoutée ou modifiée dans le site.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div role="tablist" className="tabs tabs-box w-fit">
          <button
            type="button"
            role="tab"
            aria-selected={sortMode === "icon"}
            className={`tab ${sortMode === "icon" ? "tab-active" : ""}`}
            onClick={() => setSortMode("icon")}
          >
            Trier par icône
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sortMode === "text"}
            className={`tab ${sortMode === "text" ? "tab-active" : ""}`}
            onClick={() => setSortMode("text")}
          >
            Trier par texte
          </button>
        </div>

        <div className="flex items-center gap-3 text-base-content/60">
          <span className="flex items-center gap-1">
            <span className="badge badge-warning badge-sm" />
            Icône ↔ texte incohérent
          </span>
          <span className="flex items-center gap-1">
            <span className="badge badge-ghost badge-outline badge-sm" />
            Sans texte ni aria-label
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-md">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Icône</th>
              <th>Texte visible</th>
              <th>Aria-label</th>
              <th>Fichier</th>
              <th>Contexte</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((usage, index) => {
              const Icon = getIconComponent(usage.icon);
              const isInconsistentIcon = inconsistentIcons.has(usage.icon);
              const isInconsistentText = usage.visibleText
                ? inconsistentTexts.has(usage.visibleText)
                : false;
              const hasNoLabel = !usage.visibleText && !usage.ariaLabel;

              return (
                <tr
                  key={`${usage.icon}-${usage.file}-${index}`}
                  className={
                    isInconsistentIcon || isInconsistentText
                      ? "bg-warning/10"
                      : hasNoLabel
                        ? "bg-base-200/60"
                        : ""
                  }
                >
                  <td>
                    <span className="flex items-center gap-2">
                      {Icon ? <Icon size={16} /> : null}
                      <code className="text-xs">{usage.icon}</code>
                    </span>
                  </td>
                  <td>
                    {usage.visibleText ?? (
                      <span className="text-base-content/40">—</span>
                    )}
                  </td>
                  <td>
                    {usage.ariaLabel ?? (
                      <span className="text-base-content/40">—</span>
                    )}
                  </td>
                  <td>
                    <code className="text-xs text-base-content/70">
                      {usage.file}
                    </code>
                  </td>
                  <td className="text-base-content/60">
                    {usage.context ?? ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Propositions</h2>
        {iconProposals.length === 0 ? (
          <p className="text-sm text-base-content/50">
            Aucune proposition en attente.
          </p>
        ) : null}
        <ul className="space-y-2">
          {iconProposals.map((proposal) => {
            const Icon = getIconComponent(proposal.icon);
            return (
              <li
                key={`${proposal.date}-${proposal.icon}-${proposal.label}`}
                className="flex flex-wrap items-center gap-3 rounded-box border border-base-300 bg-base-100 p-3"
              >
                {Icon ? <Icon size={18} /> : null}
                <code className="text-xs">{proposal.icon}</code>
                <span className="font-medium">{proposal.label}</span>
                {proposal.note ? (
                  <span className="text-sm text-base-content/60">
                    {proposal.note}
                  </span>
                ) : null}
                <span className="ml-auto text-xs text-base-content/40">
                  {proposal.date}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
