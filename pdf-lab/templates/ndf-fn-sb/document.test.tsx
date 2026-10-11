import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { ExpenseReportDocument } from "./document";
import { fixture } from "./fixture";

function pageCount(buffer: Buffer) {
  return buffer.toString("latin1").match(/\/Type \/Page\b/gu)?.length ?? 0;
}

describe("ExpenseReportDocument", () => {
  it("tient sur une seule page quand le tableau est court", async () => {
    const document = (
      <ExpenseReportDocument data={fixture} />
    ) as unknown as Parameters<typeof renderToBuffer>[0];

    const buffer = await renderToBuffer(document);

    // Régression : un saut de page forcé coupait le tableau « Conditions de
    // règlement » en deux, quelle que soit la place disponible.
    expect(pageCount(buffer)).toBe(1);
  }, 60_000);
});
