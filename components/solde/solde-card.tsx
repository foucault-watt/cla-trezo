"use client";

import { useState } from "react";
import type { SoldeView } from "@/lib/solde/solde";

const currency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
const monthFormat = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});
const dayFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

const BATCH_SIZE = 10;
const MONTH_SEPARATOR_THRESHOLD = 20;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function SoldeCard({
  solde,
}: {
  solde: Extract<SoldeView, { status: "not_initialized" | "ready" }>;
}) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  if (solde.status === "not_initialized") {
    return (
      <div className="card mt-2 border border-base-300 bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Solde</h2>
          <div role="alert" className="alert alert-info alert-soft">
            <span>
              Le solde de ce Club n&apos;a pas encore été initialisé par un
              administrateur.
            </span>
          </div>
        </div>
      </div>
    );
  }

  const movements = solde.movements; // le plus récent en premier
  const visible = movements.slice(0, visibleCount);
  const showMonthSeparators = movements.length > MONTH_SEPARATOR_THRESHOLD;

  const rows = visible.map((m, i) => {
    const key = monthKey(m.createdAt);
    const previousKey = i > 0 ? monthKey(visible[i - 1].createdAt) : null;
    const isNewMonth = showMonthSeparators && key !== previousKey;
    return { m, isNewMonth };
  });

  return (
    <div className="card border border-base-300 bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title">Solde</h2>

        <div className="stats bg-transparent">
          <div className="stat px-0">
            <div className="stat-title">Solde actuel</div>
            <div className="stat-value">
              {currency.format(solde.balanceCents / 100)}
            </div>
          </div>
        </div>

        <h3 className="mt-2 text-sm font-medium text-base-content/70">
          Historique des mouvements
        </h3>
        {movements.length === 0 ? (
          <p className="text-base-content/70">Aucun mouvement.</p>
        ) : (
          <div className="flex flex-col">
            <ul className="flex flex-col">
              {rows.map(({ m, isNewMonth }) => (
                <li key={m.id}>
                  {isNewMonth && (
                    <div className="divider my-1 text-xs text-base-content/50 capitalize">
                      {monthFormat.format(m.createdAt)}
                    </div>
                  )}
                  <div className="grid grid-cols-[3.5rem_1fr_auto] items-start gap-x-3 py-1.5">
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
                      {currency.format(m.amountCents / 100)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex justify-center gap-2">
              {visibleCount < movements.length && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setVisibleCount((c) => c + BATCH_SIZE)}
                >
                  Charger 10 mouvements de plus (
                  {movements.length - visibleCount} restants)
                </button>
              )}
              {visibleCount > BATCH_SIZE && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setVisibleCount(BATCH_SIZE)}
                >
                  Réduire
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
