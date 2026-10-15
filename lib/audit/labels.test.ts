import { describe, expect, it } from "vitest";
import { auditActionLabel } from "./labels";

describe("auditActionLabel", () => {
  it("nomme les transitions de Note de frais", () => {
    expect(auditActionLabel("ExpenseReport.SUBMITTED")).toBe(
      "Note de frais · soumission",
    );
    expect(auditActionLabel("ExpenseReport.FINALIZED")).toBe(
      "Note de frais · validation",
    );
  });

  it("nomme les opérations courantes", () => {
    expect(auditActionLabel("ExpenseReportLine.deleteMany")).toBe(
      "Remboursement · suppression multiple",
    );
    expect(auditActionLabel("TypeDepense.create")).toBe(
      "Type de dépense · création",
    );
  });

  it("laisse lisible une clé inconnue", () => {
    expect(auditActionLabel("NouveauModele.archive")).toBe(
      "NouveauModele · archive",
    );
    expect(auditActionLabel("brut")).toBe("brut");
  });
});
