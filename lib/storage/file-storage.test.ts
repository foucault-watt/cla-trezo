import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildExpenseReportPdfPath,
  buildSupportingDocumentPath,
  deleteStoredFile,
  readStoredFile,
  storedFileExists,
  writeStoredFile,
} from "./file-storage";

let tempRoot: string;
let previousStorageRootDir: string | undefined;

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(tmpdir(), "cla-trezo-storage-test-"));
  previousStorageRootDir = process.env.STORAGE_ROOT_DIR;
  process.env.STORAGE_ROOT_DIR = tempRoot;
});

afterEach(async () => {
  process.env.STORAGE_ROOT_DIR = previousStorageRootDir;
  await rm(tempRoot, { recursive: true, force: true });
});

describe("buildSupportingDocumentPath", () => {
  it("génère un chemin {assoSlug}/{year}/{reportId}/{uuid}.{extension}", () => {
    const relativePath = buildSupportingDocumentPath({
      assoSlug: "club-info",
      reportId: "report-1",
      extension: "pdf",
      now: new Date("2024-03-15T00:00:00Z"),
    });

    const segments = relativePath.split("/");
    expect(segments[0]).toBe("club-info");
    expect(segments[1]).toBe("2024");
    expect(segments[2]).toBe("report-1");
    expect(segments[3]).toMatch(/^[0-9a-f-]{36}\.pdf$/);
  });

  it("refuse un assoSlug qui contiendrait un séparateur de chemin", () => {
    expect(() =>
      buildSupportingDocumentPath({
        assoSlug: "../evil",
        reportId: "report-1",
        extension: "pdf",
      }),
    ).toThrow();
  });
});

describe("buildExpenseReportPdfPath", () => {
  it("génère un chemin {assoSlug}/{year}/{reportId}/{uuid}.{extension}", () => {
    const relativePath = buildExpenseReportPdfPath({
      assoSlug: "club-info",
      reportId: "report-1",
      extension: "pdf",
      now: new Date("2024-03-15T00:00:00Z"),
    });

    const segments = relativePath.split("/");
    expect(segments[0]).toBe("club-info");
    expect(segments[1]).toBe("2024");
    expect(segments[2]).toBe("report-1");
    expect(segments[3]).toMatch(/^[0-9a-f-]{36}\.pdf$/);
  });

  it("refuse un assoSlug qui contiendrait un séparateur de chemin", () => {
    expect(() =>
      buildExpenseReportPdfPath({
        assoSlug: "../evil",
        reportId: "report-1",
        extension: "pdf",
      }),
    ).toThrow();
  });
});

describe("writeStoredFile / readStoredFile / deleteStoredFile", () => {
  it("écrit puis relit le même contenu à la racine de stockage configurée", async () => {
    const relativePath = buildSupportingDocumentPath({
      assoSlug: "club-info",
      reportId: "report-1",
      extension: "pdf",
    });
    const content = Buffer.from("%PDF-1.4 contenu de test", "latin1");

    await writeStoredFile(relativePath, content);

    const onDisk = await readFile(path.join(tempRoot, relativePath));
    expect(onDisk.equals(content)).toBe(true);

    const reRead = await readStoredFile(relativePath);
    expect(reRead.equals(content)).toBe(true);
  });

  it("crée les sous-dossiers manquants automatiquement", async () => {
    const relativePath = buildSupportingDocumentPath({
      assoSlug: "nouvelle-asso",
      reportId: "nouveau-report",
      extension: "jpg",
    });

    await expect(
      writeStoredFile(relativePath, Buffer.from("data")),
    ).resolves.not.toThrow();
  });

  it("supprime un fichier existant sans erreur", async () => {
    const relativePath = buildSupportingDocumentPath({
      assoSlug: "club-info",
      reportId: "report-1",
      extension: "pdf",
    });
    await writeStoredFile(relativePath, Buffer.from("data"));

    await deleteStoredFile(relativePath);

    await expect(readStoredFile(relativePath)).rejects.toThrow();
  });

  it("ne lève pas d'erreur si le fichier à supprimer n'existe déjà plus", async () => {
    await expect(
      deleteStoredFile("club-info/report-1/absent.pdf"),
    ).resolves.not.toThrow();
  });
});

describe("storedFileExists", () => {
  it("renvoie true pour un fichier présent, false pour un fichier absent", async () => {
    const relativePath = buildSupportingDocumentPath({
      assoSlug: "club-info",
      reportId: "report-1",
      extension: "pdf",
    });
    await writeStoredFile(relativePath, Buffer.from("data"));

    await expect(storedFileExists(relativePath)).resolves.toBe(true);
    await expect(
      storedFileExists("club-info/report-1/absent.pdf"),
    ).resolves.toBe(false);
  });
});
