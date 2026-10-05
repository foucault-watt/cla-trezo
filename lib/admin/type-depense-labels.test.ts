import { describe, expect, it } from "vitest";
import {
  findTypeDepenseByLabel,
  groupCustomLabels,
  typeDepenseLabelKey,
} from "./type-depense-labels";

const types = [
  { id: "t-materiel", label: "Matériel" },
  { id: "t-transport", label: "Transport" },
];

describe("typeDepenseLabelKey", () => {
  it("ignore casse, accents et espaces superflus", () => {
    expect(typeDepenseLabelKey("  MATERIEL ")).toBe(
      typeDepenseLabelKey("Matériel"),
    );
    expect(typeDepenseLabelKey("Frais   de  port")).toBe("frais de port");
  });
});

describe("findTypeDepenseByLabel", () => {
  it("retrouve un Type équivalent malgré une autre orthographe", () => {
    expect(findTypeDepenseByLabel(types, "materiel")?.id).toBe("t-materiel");
  });

  it("ignore le Type exclu (renommage d'un Type en lui-même)", () => {
    expect(
      findTypeDepenseByLabel(types, "MATÉRIEL", "t-materiel"),
    ).toBeUndefined();
  });

  it("ne retrouve rien pour un libellé nouveau", () => {
    expect(findTypeDepenseByLabel(types, "Sport")).toBeUndefined();
  });
});

describe("groupCustomLabels", () => {
  it("regroupe par libellé exact, compte Remboursements, Notes et Structures", () => {
    const groups = groupCustomLabels(
      [
        { customLabel: "Sport", expenseReportId: "r1", assoName: "BDS" },
        { customLabel: "Sport", expenseReportId: "r1", assoName: "BDS" },
        { customLabel: "Sport", expenseReportId: "r2", assoName: "Aviron" },
        { customLabel: "sport", expenseReportId: "r3", assoName: "BDS" },
      ],
      types,
    );

    expect(groups).toEqual([
      {
        label: "Sport",
        reimbursementCount: 3,
        expenseReportCount: 2,
        assoNames: ["Aviron", "BDS"],
        matchingType: null,
      },
      {
        label: "sport",
        reimbursementCount: 1,
        expenseReportCount: 1,
        assoNames: ["BDS"],
        matchingType: null,
      },
    ]);
  });

  it("signale le Type existant équivalent à un libellé personnalisé", () => {
    const [group] = groupCustomLabels(
      [{ customLabel: "materiel", expenseReportId: "r1", assoName: "BDS" }],
      types,
    );

    expect(group.matchingType).toEqual({ id: "t-materiel", label: "Matériel" });
  });
});
