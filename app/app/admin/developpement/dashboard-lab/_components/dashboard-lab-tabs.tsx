"use client";

import { useState } from "react";
import type { MockAssoType } from "./fixtures";
import { VariantATimeline } from "./variant-a-timeline";
import { VariantBGrid } from "./variant-b-grid";
import { VariantCHero } from "./variant-c-hero";

type DashboardLabTab = "variant-a" | "variant-b" | "variant-c";

export function DashboardLabTabs() {
  const [activeTab, setActiveTab] = useState<DashboardLabTab>("variant-a");
  const [assoType, setAssoType] = useState<MockAssoType>("CLUB");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" className="tabs tabs-box w-fit">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "variant-a"}
            className={`tab ${activeTab === "variant-a" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("variant-a")}
          >
            A · Retenue (accordéon annuel)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "variant-b"}
            className={`tab ${activeTab === "variant-b" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("variant-b")}
          >
            B · Grille de cartes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "variant-c"}
            className={`tab ${activeTab === "variant-c" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("variant-c")}
          >
            C · Résumé + accordéon
          </button>
        </div>

        <div className="join">
          <button
            type="button"
            className={`join-item btn btn-sm ${assoType === "CLUB" ? "btn-active" : ""}`}
            onClick={() => setAssoType("CLUB")}
          >
            Club
          </button>
          <button
            type="button"
            className={`join-item btn btn-sm ${assoType === "STRUCTURE" ? "btn-active" : ""}`}
            onClick={() => setAssoType("STRUCTURE")}
          >
            Commission / Association
          </button>
        </div>
      </div>

      <div className="rounded-box border border-base-300 bg-base-200/40 p-4 sm:p-6">
        {activeTab === "variant-a" ? (
          <VariantATimeline assoType={assoType} />
        ) : activeTab === "variant-b" ? (
          <VariantBGrid assoType={assoType} />
        ) : (
          <VariantCHero assoType={assoType} />
        )}
      </div>
    </div>
  );
}
