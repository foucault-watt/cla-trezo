import { describe, expect, it } from "vitest";
import {
  groupExpenseReportLinesByFundingSource,
  type ExpenseReportLineForGrouping,
} from "./expense-report-validation-grouping";

function line(
  overrides: Partial<ExpenseReportLineForGrouping> & { id: string },
): ExpenseReportLineForGrouping {
  return {
    amountCents: 1000,
    fundingSource: "CLUB_BALANCE",
    subventionId: null,
    ...overrides,
  };
}

describe("groupExpenseReportLinesByFundingSource", () => {
  it("regroupe en un seul groupe Solde quand toutes les Lignes sont financées par le Solde", () => {
    const lines = [
      line({ id: "l1", amountCents: 1000 }),
      line({ id: "l2", amountCents: 2000 }),
    ];

    const groups = groupExpenseReportLinesByFundingSource(lines);

    expect(groups).toEqual([
      { kind: "CLUB_BALANCE", lines: [lines[0], lines[1]] },
    ]);
  });

  it("regroupe en un seul groupe Subvention quand toutes les Lignes financent la même Subvention", () => {
    const lines = [
      line({
        id: "l1",
        fundingSource: "SUBVENTION",
        subventionId: "sub-1",
        amountCents: 500,
      }),
      line({
        id: "l2",
        fundingSource: "SUBVENTION",
        subventionId: "sub-1",
        amountCents: 700,
      }),
    ];

    const groups = groupExpenseReportLinesByFundingSource(lines);

    expect(groups).toEqual([
      { kind: "SUBVENTION", subventionId: "sub-1", lines: [lines[0], lines[1]] },
    ]);
  });

  it("produit un groupe par Subvention distincte plus un groupe Solde quand les sources sont mélangées", () => {
    const soldeLine = line({ id: "l-solde", amountCents: 300 });
    const subALine1 = line({
      id: "l-a1",
      fundingSource: "SUBVENTION",
      subventionId: "sub-a",
      amountCents: 100,
    });
    const subBLine = line({
      id: "l-b1",
      fundingSource: "SUBVENTION",
      subventionId: "sub-b",
      amountCents: 200,
    });
    const subALine2 = line({
      id: "l-a2",
      fundingSource: "SUBVENTION",
      subventionId: "sub-a",
      amountCents: 150,
    });

    const groups = groupExpenseReportLinesByFundingSource([
      soldeLine,
      subALine1,
      subBLine,
      subALine2,
    ]);

    expect(groups).toEqual([
      { kind: "SUBVENTION", subventionId: "sub-a", lines: [subALine1, subALine2] },
      { kind: "SUBVENTION", subventionId: "sub-b", lines: [subBLine] },
      { kind: "CLUB_BALANCE", lines: [soldeLine] },
    ]);
  });

  it("ne produit aucun groupe pour une liste de Lignes vide", () => {
    expect(groupExpenseReportLinesByFundingSource([])).toEqual([]);
  });
});
