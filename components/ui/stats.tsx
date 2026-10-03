import type { ReactNode } from "react";

// Sous `sm`, daisyUI n'a pas de variante en grille : on remplace ses
// séparateurs par des pointillés entre colonnes (impairs) et entre rangées
// (toutes sauf la dernière), et un dernier chiffre seul prend toute la largeur.
const MOBILE_GRID = [
  "max-sm:grid max-sm:grid-flow-row max-sm:grid-cols-2",
  "max-sm:[&>.stat]:border-0 max-sm:[&>.stat]:px-4",
  "max-sm:[&>.stat]:border-dashed max-sm:[&>.stat]:border-base-content/10",
  "max-sm:[&>.stat:nth-child(odd):not(:last-child)]:border-e",
  "max-sm:[&>.stat:nth-last-child(n+3)]:border-b",
  "max-sm:[&>.stat:nth-child(even):nth-last-child(2)]:border-b",
  "max-sm:[&>.stat:last-child:nth-child(odd)]:col-span-2",
  "max-sm:[&_.stat-title]:whitespace-normal max-sm:[&_.stat-value]:text-xl",
].join(" ");

/**
 * Barre de chiffres clés, un seul style pour tout le site (cf.
 * docs/design/COMPONENTS.md, "Stats bar") : daisyUI `stats` en surface
 * (base-100 + bordure + ombre), grille de 2 colonnes sous `sm`, horizontale
 * au-delà. Les marges restent à l'appelant via `className`.
 */
export function StatsBar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`stats w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal ${MOBILE_GRID} ${className}`}
    >
      {children}
    </div>
  );
}

export function Stat({
  title,
  value,
  desc,
  valueClassName = "",
  descClassName = "",
}: {
  title: ReactNode;
  value?: ReactNode;
  desc?: ReactNode;
  valueClassName?: string;
  descClassName?: string;
}) {
  return (
    <div className="stat">
      <div className="stat-title">{title}</div>
      {value !== undefined && (
        <div className={`stat-value text-2xl ${valueClassName}`}>{value}</div>
      )}
      {desc !== undefined && desc !== null && (
        <div className={`stat-desc ${descClassName}`}>{desc}</div>
      )}
    </div>
  );
}
