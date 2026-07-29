import { describe, expect, it } from "vitest";
import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";
import {
  assertExpenseReportMutable,
  assertExpenseReportTransition,
  ExpenseReportLifecycleError,
  type ExpenseReportActor,
} from "./expense-report-lifecycle";

const STRUCTURE: ExpenseReportActor = { type: "STRUCTURE", assoId: "asso-1" };
const ADMIN: ExpenseReportActor = { type: "ADMIN" };

describe("assertExpenseReportTransition", () => {
  it("autorise Brouillon → Soumise par la Structure", () => {
    expect(() =>
      assertExpenseReportTransition({
        from: "DRAFT",
        to: "SUBMITTED",
        actor: STRUCTURE,
      }),
    ).not.toThrow();
  });

  it("refuse Brouillon → Soumise par l'Admin", () => {
    expect(() =>
      assertExpenseReportTransition({
        from: "DRAFT",
        to: "SUBMITTED",
        actor: ADMIN,
      }),
    ).toThrow(ExpenseReportLifecycleError);
  });

  it("autorise Soumise → Prise en charge par l'Admin", () => {
    expect(() =>
      assertExpenseReportTransition({
        from: "SUBMITTED",
        to: "TAKEN_OVER",
        actor: ADMIN,
      }),
    ).not.toThrow();
  });

  it("refuse Soumise → Prise en charge par la Structure", () => {
    expect(() =>
      assertExpenseReportTransition({
        from: "SUBMITTED",
        to: "TAKEN_OVER",
        actor: STRUCTURE,
      }),
    ).toThrow(ExpenseReportLifecycleError);
  });

  it("autorise Prise en charge → Validée par l'Admin", () => {
    expect(() =>
      assertExpenseReportTransition({
        from: "TAKEN_OVER",
        to: "FINALIZED",
        actor: ADMIN,
      }),
    ).not.toThrow();
  });

  it("refuse Prise en charge → Validée par la Structure", () => {
    expect(() =>
      assertExpenseReportTransition({
        from: "TAKEN_OVER",
        to: "FINALIZED",
        actor: STRUCTURE,
      }),
    ).toThrow(ExpenseReportLifecycleError);
  });

  it("autorise Prise en charge → Rejetée par l'Admin", () => {
    expect(() =>
      assertExpenseReportTransition({
        from: "TAKEN_OVER",
        to: "REJECTED",
        actor: ADMIN,
      }),
    ).not.toThrow();
  });

  it("refuse Prise en charge → Rejetée par la Structure", () => {
    expect(() =>
      assertExpenseReportTransition({
        from: "TAKEN_OVER",
        to: "REJECTED",
        actor: STRUCTURE,
      }),
    ).toThrow(ExpenseReportLifecycleError);
  });

  it("refuse une transition absente de la table, quel que soit l'acteur", () => {
    expect(() =>
      assertExpenseReportTransition({
        from: "DRAFT",
        to: "TAKEN_OVER",
        actor: ADMIN,
      }),
    ).toThrow(ExpenseReportLifecycleError);
    expect(() =>
      assertExpenseReportTransition({
        from: "SUBMITTED",
        to: "REJECTED",
        actor: ADMIN,
      }),
    ).toThrow(ExpenseReportLifecycleError);
    expect(() =>
      assertExpenseReportTransition({
        from: "REJECTED",
        to: "DRAFT",
        actor: ADMIN,
      }),
    ).toThrow(ExpenseReportLifecycleError);
  });
});

describe("assertExpenseReportMutable", () => {
  it.each(["DRAFT", "SUBMITTED"] as const)(
    "autorise la Structure à modifier en statut %s",
    (status) => {
      expect(() =>
        assertExpenseReportMutable({ status, actor: STRUCTURE }),
      ).not.toThrow();
    },
  );

  it.each(["TAKEN_OVER", "FINALIZED", "REJECTED"] as ExpenseReportStatus[])(
    "refuse la Structure en statut %s",
    (status) => {
      expect(() =>
        assertExpenseReportMutable({ status, actor: STRUCTURE }),
      ).toThrow(ExpenseReportLifecycleError);
    },
  );

  it("refuse l'Admin, y compris en statut modifiable pour la Structure", () => {
    expect(() =>
      assertExpenseReportMutable({ status: "DRAFT", actor: ADMIN }),
    ).toThrow(ExpenseReportLifecycleError);
    expect(() =>
      assertExpenseReportMutable({ status: "SUBMITTED", actor: ADMIN }),
    ).toThrow(ExpenseReportLifecycleError);
  });
});
