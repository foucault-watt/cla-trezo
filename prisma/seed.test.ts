import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";

describe("seed des TypeDepense", () => {
  it("expose les types de dépense par défaut après le seed", async () => {
    const labels = await prisma.typeDepense.findMany({
      select: { label: true },
    });

    expect(labels.map((t) => t.label)).toEqual(
      expect.arrayContaining([
        "Nourriture",
        "Transport",
        "Matériel",
        "Événement",
        "Communication",
        "Autre",
      ]),
    );
  });
});
