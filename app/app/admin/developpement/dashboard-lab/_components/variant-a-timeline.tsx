"use client";

import { HandCoins, Receipt, Wallet } from "lucide-react";
import { formatCents } from "@/lib/money";
import {
  clubBalanceCents,
  clubMovements,
  notesDeFraisStats,
  recentActivity,
  subventionsStats,
  type MockAssoType,
} from "./fixtures";
import { formatDay, groupByMonth, groupByYear } from "./month-groups";

/**
 * Variante A (retenue) — stats en haut inchangées ; l'historique du solde
 * reprend le mécanisme d'accordéon de la variante C mais regroupé par année
 * (plutôt que par mois) : chaque année est une section, l'année en cours
 * ouverte par défaut, les années précédentes accessibles en un clic — plus
 * besoin de masquer les mouvements anciens, tout l'historique reste atteint.
 * L'Activité récente (cas Structure) reprend elle aussi tel quel l'accordéon
 * de la variante C.
 */
export function VariantATimeline({ assoType }: { assoType: MockAssoType }) {
  const isClub = assoType === "CLUB";

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-base-content/70">
        {isClub
          ? "Solde de l'association."
          : "Suivi des Notes de frais et Subventions de l'association."}
      </p>

      <div className="stats stats-vertical mt-4 w-full border border-base-300 bg-base-100 shadow-md sm:stats-horizontal">
        {isClub && (
          <div className="stat">
            <div className="stat-figure text-primary">
              <Wallet size={22} />
            </div>
            <div className="stat-title">Solde actuel</div>
            <div className="stat-value text-2xl">
              {formatCents(clubBalanceCents)}
            </div>
          </div>
        )}
        <div className="stat">
          <div className="stat-figure text-warning">
            <Receipt size={22} />
          </div>
          <div className="stat-title">Notes de frais en attente</div>
          <div className="stat-value text-2xl">
            {notesDeFraisStats.enAttente}
          </div>
          <div className="stat-desc">
            {notesDeFraisStats.totalLast365Days} sur les 12 derniers mois
          </div>
        </div>
        <div className="stat">
          <div className="stat-figure text-success">
            <HandCoins size={22} />
          </div>
          <div className="stat-title">Subventions restantes</div>
          <div className="stat-value text-2xl">
            {formatCents(subventionsStats.montantRestantLast365DaysCents)}
          </div>
          <div className="stat-desc">
            sur {formatCents(subventionsStats.montantTotalLast365DaysCents)} ·
            12 derniers mois
          </div>
        </div>
      </div>

      <h3 className="mt-6 mb-2 text-sm font-medium text-base-content/70">
        {isClub ? "Historique du solde" : "Activité récente"}
      </h3>

      {isClub ? <ClubYearAccordion /> : <StructureAccordion />}
    </div>
  );
}

function ClubYearAccordion() {
  const groups = groupByYear(clubMovements);

  return (
    <div className="join join-vertical w-full">
      {groups.map((group, index) => (
        <div
          key={group.key}
          className="collapse-arrow join-item collapse border border-base-300 bg-base-100"
        >
          <input
            type="radio"
            name="solde-year-accordion"
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
