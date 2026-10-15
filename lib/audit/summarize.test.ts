import { describe, expect, it } from "vitest";
import {
  auditActionKey,
  isAuditedMutation,
  summarizeMutation,
} from "./summarize";

const REPORT = "11111111-1111-4111-8111-111111111111";
const ASSO = "22222222-2222-4222-8222-222222222222";

describe("isAuditedMutation", () => {
  it("audite les écritures métier", () => {
    expect(isAuditedMutation("ExpenseReport", "update")).toBe(true);
    expect(isAuditedMutation("FinancialMovement", "createMany")).toBe(true);
  });

  it("ignore les lectures, la synchro SSO et les tables de suivi", () => {
    expect(isAuditedMutation("ExpenseReport", "findUnique")).toBe(false);
    expect(isAuditedMutation("User", "upsert")).toBe(false);
    expect(isAuditedMutation("RefAssoUser", "create")).toBe(false);
    expect(isAuditedMutation("AuditLog", "create")).toBe(false);
    expect(isAuditedMutation("PageView", "create")).toBe(false);
    expect(isAuditedMutation(undefined, "create")).toBe(false);
  });
});

describe("auditActionKey", () => {
  it("nomme une transition par le statut atteint", () => {
    expect(
      auditActionKey("ExpenseReport", "update", {
        where: { id: REPORT },
        data: { status: "SUBMITTED", submittedAt: new Date() },
      }),
    ).toBe("ExpenseReport.SUBMITTED");
  });

  it("garde l'opération pour une écriture sans statut", () => {
    expect(
      auditActionKey("ExpenseReport", "update", {
        data: { title: "Repas" },
      }),
    ).toBe("ExpenseReport.update");
    expect(auditActionKey("ExpenseReport", "create", { data: { status: "DRAFT" } })).toBe(
      "ExpenseReport.create",
    );
  });
});

describe("summarizeMutation", () => {
  it("ne garde que les noms de champs, jamais les valeurs saisies", () => {
    const summary = summarizeMutation({
      model: "ExpenseReport",
      operation: "update",
      args: {
        where: { id: REPORT },
        data: {
          beneficiaryIban: "FR7630006000011234567890189",
          beneficiaryLastname: "Dupont",
          status: "SUBMITTED",
        },
      },
      result: { id: REPORT, assoId: ASSO, beneficiaryIban: "FR76..." },
    });

    expect(summary).toEqual({
      model: "ExpenseReport",
      operation: "update",
      action: "ExpenseReport.SUBMITTED",
      entityId: REPORT,
      assoId: ASSO,
      details: {
        fields: ["beneficiaryIban", "beneficiaryLastname", "status"],
        status: "SUBMITTED",
      },
    });
    expect(JSON.stringify(summary)).not.toContain("FR76");
    expect(JSON.stringify(summary)).not.toContain("Dupont");
  });

  it("compte les lignes d'une écriture multiple", () => {
    const summary = summarizeMutation({
      model: "ExpenseReportLine",
      operation: "deleteMany",
      args: { where: { expenseReportId: REPORT } },
      result: { count: 3 },
    });
    expect(summary.entityId).toBeNull();
    expect(summary.assoId).toBeNull();
    expect(summary.details).toEqual({ count: 3 });
  });

  it("réunit les champs d'un upsert et lit l'Asso dans les données", () => {
    const summary = summarizeMutation({
      model: "GrantDocument",
      operation: "upsert",
      args: {
        where: { campaignId_assoId: { campaignId: "c", assoId: ASSO } },
        create: { assoId: ASSO, filePath: "a.pdf" },
        update: { filePath: "b.pdf", generatedAt: new Date() },
      },
      result: null,
    });
    expect(summary.assoId).toBe(ASSO);
    expect(summary.details).toEqual({
      fields: ["assoId", "filePath", "generatedAt"],
    });
  });

  it("prend l'identifiant du filtre quand le résultat n'en donne pas", () => {
    const summary = summarizeMutation({
      model: "TypeDepense",
      operation: "delete",
      args: { where: { id: REPORT } },
      result: undefined,
    });
    expect(summary.entityId).toBe(REPORT);
    expect(summary.details).toBeNull();
  });
});
