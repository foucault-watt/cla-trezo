import { describe, expect, it } from "vitest";
import { isEditableExpenseReportStatus } from "./expense-report-status";

describe("isEditableExpenseReportStatus", () => {
  it.each(["DRAFT", "SUBMITTED"] as const)(
    "autorise l'édition en statut %s",
    (status) => {
      expect(isEditableExpenseReportStatus(status)).toBe(true);
    },
  );

  it.each(["TAKEN_OVER", "FINALIZED", "REJECTED"] as const)(
    "refuse l'édition en statut %s",
    (status) => {
      expect(isEditableExpenseReportStatus(status)).toBe(false);
    },
  );
});
