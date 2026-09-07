"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCents } from "@/lib/money";
import type { SoldeView } from "@/lib/solde/solde";
import { SoldeMovementRow } from "./solde-movement-row";
import { SoldeNotInitializedAlert } from "./solde-not-initialized-alert";

const monthFormat = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
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
          <SoldeNotInitializedAlert />
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
              {formatCents(solde.balanceCents)}
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
                  <SoldeMovementRow movement={m} />
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
                  <ChevronDown size={16} />
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
                  <ChevronUp size={16} />
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
