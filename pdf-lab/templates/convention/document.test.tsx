import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { SubsidyConventionDocument } from "./document";
import { fixture } from "./fixture";

describe("SubsidyConventionDocument", () => {
  it("génère un PDF avec zéro, une et beaucoup de lignes", async () => {
    for (const length of [0, 1, 30]) {
      const expenses = Array.from({ length }, (_, index) => ({
        grantedOn: `31/12/20${String(index).padStart(2, "0")}`,
        description:
          index === 0
            ? "Déplacement très long avec caractères français : école, Noël, coût et justificatifs détaillés"
            : `Dépense dynamique ${index + 1}`,
        amount: `${index + 1} 250,00 €`,
      }));
      const document = (
        <SubsidyConventionDocument
          data={{
            ...fixture,
            firstParty: {
              ...fixture.firstParty,
              address: `${fixture.firstParty.address} - Bâtiment administratif, bureau 123`,
            },
            expenses,
          }}
        />
      ) as unknown as Parameters<typeof renderToBuffer>[0];

      const buffer = await renderToBuffer(document);

      expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
      expect(buffer.byteLength).toBeGreaterThan(10_000);
    }
  }, 60_000);
});
