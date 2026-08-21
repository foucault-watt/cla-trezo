"use client";

import { CheckCircle2, Info, Pencil, XCircle } from "lucide-react";
import { useRef } from "react";

const ADMIN_OUTCOMES = [
  {
    icon: CheckCircle2,
    color: "text-success",
    detail: "La valide telle quelle.",
  },
  {
    icon: Pencil,
    color: "text-info",
    detail: "La modifie, puis la valide.",
  },
  {
    icon: XCircle,
    color: "text-error",
    detail: "La rejette — il faudra recommencer une nouvelle note de zéro.",
  },
];

const POPOVER_WIDTH = 224;

export function AdminOutcomesPopover() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function positionPanel() {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;
    const rect = trigger.getBoundingClientRect();
    panel.style.top = `${rect.bottom + 8}px`;
    panel.style.left = `${Math.min(rect.left, window.innerWidth - POPOVER_WIDTH - 16)}px`;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        popoverTarget="admin-outcomes-popover"
        onClick={positionPanel}
        className="flex size-4 items-center justify-center rounded-full text-base-content/40 hover:text-base-content/70 focus:outline-none"
        aria-label="Voir les décisions possibles de l'Admin CLA"
      >
        <Info size={14} />
      </button>
      <div
        ref={panelRef}
        id="admin-outcomes-popover"
        popover="auto"
        className="fixed m-0 w-56 rounded-box border border-base-300 bg-base-100 p-3 shadow-lg"
      >
        <ul className="flex flex-col gap-1.5 text-xs">
          {ADMIN_OUTCOMES.map(({ icon: Icon, color, detail }) => (
            <li key={detail} className="flex items-start gap-1.5">
              <Icon size={13} className={`mt-0.5 shrink-0 ${color}`} />
              <span className="text-base-content/70">{detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
