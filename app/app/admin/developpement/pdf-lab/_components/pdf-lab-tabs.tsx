"use client";

import { useState } from "react";
import type { SubsidyConventionPdfData } from "@/pdf-lab/templates/convention/types";
import type { ExpenseReportPdfData } from "@/pdf-lab/templates/ndf-fn-sb/types";
import type { ExpenseBalancePdfData } from "@/pdf-lab/templates/ndf-solde/types";
import { ConventionPdfLabEditor } from "./convention-pdf-lab-editor";
import { IconUsageTab } from "./icon-usage-tab";
import { NdfSoldePdfLabEditor } from "./ndf-solde-pdf-lab-editor";
import { PdfLabEditor } from "./pdf-lab-editor";

type PdfLabTab =
  | "expense-report"
  | "expense-balance"
  | "subsidy-convention"
  | "icon-usage";

export function PdfLabTabs({
  expenseReportData,
  expenseBalanceData,
  subsidyConventionData,
}: {
  expenseReportData: ExpenseReportPdfData;
  expenseBalanceData: ExpenseBalancePdfData;
  subsidyConventionData: SubsidyConventionPdfData;
}) {
  const [activeTab, setActiveTab] = useState<PdfLabTab>("expense-report");

  return (
    <div className="space-y-6">
      <div role="tablist" className="tabs tabs-box w-fit">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "expense-report"}
          className={`tab ${activeTab === "expense-report" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("expense-report")}
        >
          Note de frais
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "expense-balance"}
          className={`tab ${activeTab === "expense-balance" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("expense-balance")}
        >
          Note de frais (solde)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "subsidy-convention"}
          className={`tab ${activeTab === "subsidy-convention" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("subsidy-convention")}
        >
          Convention de subvention
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "icon-usage"}
          className={`tab ${activeTab === "icon-usage" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("icon-usage")}
        >
          Icônes
        </button>
      </div>

      {activeTab === "expense-report" ? (
        <PdfLabEditor initialData={expenseReportData} />
      ) : activeTab === "expense-balance" ? (
        <NdfSoldePdfLabEditor initialData={expenseBalanceData} />
      ) : activeTab === "subsidy-convention" ? (
        <ConventionPdfLabEditor initialData={subsidyConventionData} />
      ) : (
        <IconUsageTab />
      )}
    </div>
  );
}
