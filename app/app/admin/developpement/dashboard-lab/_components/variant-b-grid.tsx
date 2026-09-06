"use client";

import { useState } from "react";
import { ArrowRight, HandCoins, History, Receipt, Wallet } from "lucide-react";
import { formatCents } from "@/lib/money";
import {
  clubBalanceCents,
  clubMovements,
  clubMovementsLast365Days,
  clubOlderMovementsCount,
  notesDeFraisStats,
  recentActivity,
  subventionsStats,
  type MockAssoType,
} from "./fixtures";
import { formatDay, formatMonth } from "./month-groups";

const PAGE_SIZE = 5;

/**
 * Variante B — grille de cartes courtes (une info = une carte, cliquable vers
 * la page concernée) et historique du solde en tableau paginé (au lieu d'un
 * "charger plus" qui accumule tout dans la page). Une mini sparkline sur la
 * carte Solde donne la tendance en un coup d'œil.
 */
export function VariantBGrid({ assoType }: { assoType: MockAssoType }) {
  const isClub = assoType === "CLUB";

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-base-content/70">
        {isClub
          ? "Solde de l'association."
          : "Suivi des Notes de frais et Subventions de l'association."}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isClub && <SoldeCardTile />}
        {!isClub && <SubventionsCardTile />}
        <NotesDeFraisCardTile />
        {isClub && <SubventionsCardTile />}
        <DerniereActiviteCardTile isClub={isClub} />
      </div>

      <h3 className="mt-6 mb-2 text-sm font-medium text-base-content/70">
        {isClub
          ? "Historique du solde (365 derniers jours)"
          : "Activité récente"}
      </h3>

      {isClub ? <ClubHistoryTable /> : <StructureHistoryTable />}
    </div>
  );
}

function Sparkline() {
  const chronological = [...clubMovements].reverse();
  const points = chronological.reduce<number[]>((acc, m) => {
    const previous = acc.length > 0 ? acc[acc.length - 1] : 0;
    const delta = m.type === "CREDIT" ? m.amountCents : -m.amountCents;
    return [...acc, previous + delta];
  }, []);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 120;
  const height = 32;
  const coords = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="text-primary"
      aria-hidden="true"
    >
      <polyline
        points={coords}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SoldeCardTile() {
  return (
    <a
      href="#"
      className="card border border-base-300 bg-base-100 shadow-md transition-shadow hover:shadow-lg"
    >
      <div className="card-body gap-1 p-4">
        <div className="flex items-center gap-2 text-base-content/60">
          <Wallet size={16} />
          <span className="text-xs">Solde actuel</span>
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className="text-2xl font-semibold">
            {formatCents(clubBalanceCents)}
          </span>
          <Sparkline />
        </div>
      </div>
    </a>
  );
}

function NotesDeFraisCardTile() {
  return (
    <a
      href="#"
      className="card border border-base-300 bg-base-100 shadow-md transition-shadow hover:shadow-lg"
    >
      <div className="card-body gap-1 p-4">
        <div className="flex items-center gap-2 text-base-content/60">
          <Receipt size={16} />
          <span className="text-xs">Notes de frais</span>
        </div>
        <span className="text-2xl font-semibold">
          {notesDeFraisStats.enAttente}{" "}
          <span className="text-sm font-normal text-base-content/60">
            en attente
          </span>
        </span>
        <div className="card-actions mt-1 items-center justify-between">
          <span className="text-xs text-base-content/60">
            {notesDeFraisStats.totalLast365Days} sur 12 mois ·{" "}
            {formatCents(notesDeFraisStats.montantTotalLast365DaysCents)}
          </span>
          <ArrowRight size={14} className="text-base-content/40" />
        </div>
      </div>
    </a>
  );
}

function SubventionsCardTile() {
  return (
    <a
      href="#"
      className="card border border-base-300 bg-base-100 shadow-md transition-shadow hover:shadow-lg"
    >
      <div className="card-body gap-1 p-4">
        <div className="flex items-center gap-2 text-base-content/60">
          <HandCoins size={16} />
          <span className="text-xs">Subventions</span>
        </div>
        <span className="text-2xl font-semibold">
          {formatCents(subventionsStats.montantRestantLast365DaysCents)}
          <span className="text-sm font-normal text-base-content/60">
            {" "}
            restant
          </span>
        </span>
        <div className="card-actions mt-1 items-center justify-between">
          <span className="text-xs text-base-content/60">
            {subventionsStats.actives} active
            {subventionsStats.actives > 1 ? "s" : ""} sur 12 mois · prochaine{" "}
            {formatMonth(subventionsStats.prochaine.date)}
          </span>
          <ArrowRight size={14} className="text-base-content/40" />
        </div>
      </div>
    </a>
  );
}

function DerniereActiviteCardTile({ isClub }: { isClub: boolean }) {
  const last = isClub
    ? recentActivity[0]
    : recentActivity.find((a) => a.kind !== "solde")!;
  return (
    <div className="card border border-base-300 bg-base-100 shadow-md">
      <div className="card-body gap-1 p-4">
        <div className="flex items-center gap-2 text-base-content/60">
          <History size={16} />
          <span className="text-xs">Dernière activité</span>
        </div>
        <span className="text-sm font-medium">{last.label}</span>
        <span className="text-xs text-base-content/60">
          {formatDay(last.date)} · {last.detail}
        </span>
      </div>
    </div>
  );
}

function ClubHistoryTable() {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(clubMovementsLast365Days.length / PAGE_SIZE);
  const visible = clubMovementsLast365Days.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div className="card border border-base-300 bg-base-100 shadow-md">
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table-zebra table table-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Catégorie</th>
                <th>Description</th>
                <th className="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap text-base-content/60">
                    {formatDay(m.date)}
                  </td>
                  <td>
                    <span className="badge badge-ghost badge-sm">
                      {m.category}
                    </span>
                  </td>
                  <td>{m.label}</td>
                  <td
                    className={`text-right font-medium tabular-nums ${m.type === "CREDIT" ? "text-success" : "text-error"}`}
                  >
                    {m.type === "CREDIT" ? "+" : "-"}
                    {formatCents(m.amountCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pageCount > 1 && (
          <div className="flex justify-center p-3">
            <div className="join">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`join-item btn btn-sm ${page === i ? "btn-active" : ""}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
        {clubOlderMovementsCount > 0 && (
          <p className="border-t border-base-300 p-3 text-center text-xs text-base-content/50">
            {clubOlderMovementsCount} mouvement
            {clubOlderMovementsCount > 1 ? "s" : ""} antérieur
            {clubOlderMovementsCount > 1 ? "s" : ""} à 12 mois, déjà compté
            {clubOlderMovementsCount > 1 ? "s" : ""} dans le Solde actuel mais
            masqué{clubOlderMovementsCount > 1 ? "s" : ""} ici.
          </p>
        )}
      </div>
    </div>
  );
}

function StructureHistoryTable() {
  const items = recentActivity.filter((a) => a.kind !== "solde");
  return (
    <div className="card border border-base-300 bg-base-100 shadow-md">
      <div className="card-body p-0">
        <div className="overflow-x-auto">
          <table className="table-zebra table table-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap text-base-content/60">
                    {formatDay(a.date)}
                  </td>
                  <td>
                    <span className="badge badge-ghost badge-sm">
                      {a.kind === "note-de-frais"
                        ? "Note de frais"
                        : "Subvention"}
                    </span>
                  </td>
                  <td>
                    {a.label}
                    <span className="ml-2 text-xs text-base-content/60">
                      {a.detail}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
