import { describe, expect, it } from "vitest";
import { formatCentsForPdf } from "@/lib/money";
import {
  grantDocumentTotal,
  parseGrantDocumentAmount,
} from "./grant-document-total";

describe("parseGrantDocumentAmount", () => {
  it("lit un montant formaté avec espaces insécables et symbole €", () => {
    expect(parseGrantDocumentAmount("1 234,56 €")).toBe(123456);
    expect(parseGrantDocumentAmount("650,00 €")).toBe(65000);
    expect(parseGrantDocumentAmount("12.5")).toBe(1250);
  });

  it("renvoie null pour un montant vide ou illisible", () => {
    expect(parseGrantDocumentAmount("")).toBeNull();
    expect(parseGrantDocumentAmount(" € ")).toBeNull();
    expect(parseGrantDocumentAmount("douze euros")).toBeNull();
  });
});

describe("grantDocumentTotal", () => {
  it("additionne les lignes et formate le total pour le PDF", () => {
    expect(
      grantDocumentTotal([{ amount: "650,00 €" }, { amount: "1 100,00 €" }]),
    ).toBe(formatCentsForPdf(175000));
  });

  it("renvoie null dès qu'une ligne est illisible", () => {
    expect(
      grantDocumentTotal([{ amount: "650,00 €" }, { amount: "?" }]),
    ).toBeNull();
  });
});
