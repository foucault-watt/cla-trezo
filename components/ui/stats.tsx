import type { ReactNode } from "react";

/**
 * Barre de chiffres clés, un seul style pour tout le site (cf.
 * docs/design/COMPONENTS.md, "Stats bar") : daisyUI `stats` en surface
 * (base-100 + bordure + ombre), empilée sous `sm`, horizontale au-delà.
 * Les marges restent à l'appelant via `className`.
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
      className={`stats stats-vertical w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal ${className}`}
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
