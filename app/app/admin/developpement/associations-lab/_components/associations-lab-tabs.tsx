"use client";

import { useState } from "react";
import type { MockAssoType } from "./fixtures";
import { VariantAStacked } from "./variant-a-stacked";
import { VariantBGrid } from "./variant-b-grid";
import { VariantCTabs } from "./variant-c-tabs";

type AssociationsLabTab = "variant-a" | "variant-b" | "variant-c";

export function AssociationsLabTabs() {
  const [activeTab, setActiveTab] = useState<AssociationsLabTab>("variant-a");
  const [assoType, setAssoType] = useState<MockAssoType>("CLUB");
  const [initialized, setInitialized] = useState(true);

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
            A · Sections empilées
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
            C · Résumé + onglets
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
              className={`join-item btn btn-sm ${assoType === "ASSOCIATION_1901" ? "btn-active" : ""}`}
              onClick={() => setAssoType("ASSOCIATION_1901")}
            >
              Association 1901
            </button>
          </div>

          <div className="join">
            <button
              type="button"
              className={`join-item btn btn-sm ${initialized ? "btn-active" : ""}`}
              onClick={() => setInitialized(true)}
            >
              Initialisé
            </button>
            <button
              type="button"
              className={`join-item btn btn-sm ${!initialized ? "btn-active" : ""}`}
              onClick={() => setInitialized(false)}
            >
              Pas encore
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-box border border-base-300 bg-base-200/40 p-4 sm:p-6">
        {activeTab === "variant-a" ? (
          <VariantAStacked assoType={assoType} initialized={initialized} />
        ) : activeTab === "variant-b" ? (
          <VariantBGrid assoType={assoType} initialized={initialized} />
        ) : (
          <VariantCTabs assoType={assoType} initialized={initialized} />
        )}
      </div>
    </div>
  );
}
