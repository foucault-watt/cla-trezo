import { describe, expect, it } from "vitest";
import {
  buildAssoArchiveEntries,
  sanitizeArchiveSegment,
  toStorageOverview,
} from "./storage";

describe("sanitizeArchiveSegment", () => {
  it("remplace les séparateurs de chemin pour ne pas créer de sous-dossiers imprévus", () => {
    expect(sanitizeArchiveSegment("facture/train 15€.jpg")).toBe(
      "facture-train 15€.jpg",
    );
    expect(sanitizeArchiveSegment("a\\b/c")).toBe("a-b-c");
  });

  it("retombe sur un nom par défaut si le segment est vide une fois nettoyé", () => {
    expect(sanitizeArchiveSegment("   ")).toBe("sans-titre");
    expect(sanitizeArchiveSegment("")).toBe("sans-titre");
  });
});

describe("toStorageOverview", () => {
  it("additionne les Justificatifs et PDF sur toutes les Notes de frais de la Structure", () => {
    const overview = toStorageOverview({
      id: "asso-1",
      slug: "club-info",
      name: "Club Info",
      expenseReports: [
        {
          createdAt: new Date("2022-05-01"),
          _count: { supportingDocuments: 2, pdfs: 1 },
        },
        {
          createdAt: new Date("2024-01-10"),
          _count: { supportingDocuments: 0, pdfs: 0 },
        },
        {
          createdAt: new Date("2024-11-20"),
          _count: { supportingDocuments: 3, pdfs: 2 },
        },
      ],
    });

    expect(overview.supportingDocumentsCount).toBe(5);
    expect(overview.pdfsCount).toBe(3);
    expect(overview.reportsWithFilesCount).toBe(2);
    expect(overview.yearsSpan).toEqual({ min: 2022, max: 2024 });
  });

  it("renvoie une étendue d'années nulle quand aucune Note de frais n'a de fichier", () => {
    const overview = toStorageOverview({
      id: "asso-1",
      slug: "club-info",
      name: "Club Info",
      expenseReports: [
        {
          createdAt: new Date("2024-01-10"),
          _count: { supportingDocuments: 0, pdfs: 0 },
        },
      ],
    });

    expect(overview.yearsSpan).toBeNull();
    expect(overview.reportsWithFilesCount).toBe(0);
  });
});

describe("buildAssoArchiveEntries", () => {
  it("range chaque fichier sous {année}/{titre} ({id court})/ avec un nom lisible", () => {
    const entries = buildAssoArchiveEntries({
      expenseReports: [
        {
          id: "abcdef12-3456-7890-abcd-ef1234567890",
          title: "Sortie ski",
          createdAt: new Date("2023-02-14"),
          supportingDocuments: [
            { filePath: "club-info/2023/abcdef12/uuid-1.jpg", originalFilename: "ticket.jpg" },
          ],
          pdfs: [
            {
              filePath: "club-info/2023/abcdef12/uuid-2.pdf",
              subvention: { reason: "Aide au sport" },
            },
          ],
        },
      ],
    });

    expect(entries).toEqual([
      {
        name: "2023/Sortie ski (abcdef12)/ticket.jpg",
        filePath: "club-info/2023/abcdef12/uuid-1.jpg",
      },
      {
        name: "2023/Sortie ski (abcdef12)/PDF - Subvention - Aide au sport.pdf",
        filePath: "club-info/2023/abcdef12/uuid-2.pdf",
      },
    ]);
  });

  it("ignore les Notes de frais sans aucun fichier", () => {
    const entries = buildAssoArchiveEntries({
      expenseReports: [
        {
          id: "id-1",
          title: "Note vide",
          createdAt: new Date("2023-01-01"),
          supportingDocuments: [],
          pdfs: [],
        },
      ],
    });

    expect(entries).toEqual([]);
  });

  it("libelle le PDF de Solde du club distinctement d'un PDF de Subvention", () => {
    const entries = buildAssoArchiveEntries({
      expenseReports: [
        {
          id: "id-1",
          title: "Note",
          createdAt: new Date("2023-01-01"),
          supportingDocuments: [],
          pdfs: [{ filePath: "path/solde.pdf", subvention: null }],
        },
      ],
    });

    expect(entries[0].name).toBe("2023/Note (id-1)/PDF - Solde du club.pdf");
  });

  it("désambiguïse deux PDF portant le même libellé pour ne pas s'écraser dans le zip", () => {
    const entries = buildAssoArchiveEntries({
      expenseReports: [
        {
          id: "id-1",
          title: "Note",
          createdAt: new Date("2023-01-01"),
          supportingDocuments: [],
          pdfs: [
            { filePath: "path/a.pdf", subvention: { reason: "Aide" } },
            { filePath: "path/b.pdf", subvention: { reason: "Aide" } },
          ],
        },
      ],
    });

    expect(entries.map((e) => e.name)).toEqual([
      "2023/Note (id-1)/PDF - Subvention - Aide.pdf",
      "2023/Note (id-1)/PDF - Subvention - Aide (2).pdf",
    ]);
  });
});
