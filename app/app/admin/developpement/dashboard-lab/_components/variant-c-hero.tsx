"use client";

import { formatCents } from "@/lib/money";
import {
  clubBalanceCents,
  clubMovementsLast365Days,
  clubOlderMovementsCount,
  notesDeFraisStats,
  recentActivity,
  subventionsStats,
  type MockAssoType,
} from "./fixtures";
import { formatDay, groupByMonth } from "./month-groups";

/**
 * Variante C — un seul bloc "résumé" en haut (solde, ou avancement des
 * Subventions pour une Structure sans Solde), et l'historique en accordéon
 * mensuel à ouverture unique (radio) : plus de bouton "charger plus", le mois
 * en cours est ouvert par défaut et les mois précédents restent à un clic.
 */
export function VariantCHero({ assoType }: { assoType: MockAssoType }) {
  const isClub = assoType === "CLUB";

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-base-content/70">
        {isClub
          ? "Solde de l'association."
          : "Suivi des Notes de frais et Subventions de l'association."}
      </p>

      <div className="card mt-4 border border-base-300 bg-base-100 shadow-md">
        <div className="card-body flex-row flex-wrap items-center gap-6">
          {isClub ? <SoldeHero /> : <SubventionsHero />}

          <div className="divider divider-horizontal hidden sm:flex" />

          <div className="flex flex-wrap gap-2">
            <span className="badge badge-lg badge-warning badge-soft">
              {notesDeFraisStats.enAttente} Note
              {notesDeFraisStats.enAttente > 1 ? "s" : ""} de frais en attente
            </span>
            {isClub && (
              <span className="badge badge-lg badge-success badge-soft">
                {formatCents(subventionsStats.montantRestantLast365DaysCents)}{" "}
                de Subvention restante (12 mois)
              </span>
            )}
          </div>
        </div>
      </div>

      <h3 className="mt-6 mb-2 text-sm font-medium text-base-content/70">
        {isClub
          ? "Historique du solde (365 derniers jours)"
          : "Activité récente"}
      </h3>

      {isClub ? <ClubAccordion /> : <StructureAccordion />}
    </div>
  );
}

function SoldeHero() {
  return (
    <div>
      <div className="text-sm text-base-content/60">Solde actuel</div>
      <div className="text-4xl font-bold">{formatCents(clubBalanceCents)}</div>
    </div>
  );
}

function SubventionsHero() {
  const pct = Math.round(
    (subventionsStats.montantRestantLast365DaysCents /
      subventionsStats.montantTotalLast365DaysCents) *
      100,
  );
  return (
    <div className="flex items-center gap-4">
      <div
        className="radial-progress text-success"
        style={
          {
            "--value": pct,
            "--size": "5rem",
            "--thickness": "6px",
          } as React.CSSProperties
        }
        role="progressbar"
        aria-label="Part de subvention restante"
      >
        {pct}%
      </div>
      <div>
        <div className="text-sm text-base-content/60">
          Subventions restantes (12 derniers mois)
        </div>
        <div className="text-2xl font-bold">
          {formatCents(subventionsStats.montantRestantLast365DaysCents)}
        </div>
        <div className="text-xs text-base-content/60">
          sur {formatCents(subventionsStats.montantTotalLast365DaysCents)} ·{" "}
          {subventionsStats.actives} campagne
          {subventionsStats.actives > 1 ? "s" : ""} active
          {subventionsStats.actives > 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

function ClubAccordion() {
  const groups = groupByMonth(clubMovementsLast365Days);

  return (
    <div>
      <div className="join join-vertical w-full">
        {groups.map((group, index) => (
          <div
            key={group.key}
            className="collapse-arrow join-item collapse border border-base-300 bg-base-100"
          >
            <input
              type="radio"
              name="solde-accordion"
              defaultChecked={index === 0}
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
                      {formatDay(m.date)}
                    </span>
                    <span className="text-sm">{m.label}</span>
                    <span
                      className={`text-right text-sm font-medium tabular-nums ${m.type === "CREDIT" ? "text-success" : "text-error"}`}
                    >
                      {m.type === "CREDIT" ? "+" : "-"}
                      {formatCents(m.amountCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      {clubOlderMovementsCount > 0 && (
        <p className="mt-2 text-center text-xs text-base-content/50">
          {clubOlderMovementsCount} mouvement
          {clubOlderMovementsCount > 1 ? "s" : ""} antérieur
          {clubOlderMovementsCount > 1 ? "s" : ""} à 12 mois, déjà compté
          {clubOlderMovementsCount > 1 ? "s" : ""} dans le Solde actuel mais
          masqué{clubOlderMovementsCount > 1 ? "s" : ""} ici.
        </p>
      )}
    </div>
  );
}

function StructureAccordion() {
  const groups = groupByMonth(recentActivity);

  return (
    <div className="join join-vertical w-full">
      {groups.map((group, index) => (
        <div
          key={group.key}
          className="collapse-arrow join-item collapse border border-base-300 bg-base-100"
        >
          <input
            type="radio"
            name="activity-accordion"
            defaultChecked={index === 0}
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
                    {formatDay(a.date)}
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
      ))}
    </div>
  );
}
