import { describe, it, expect } from "vitest";
import {
  detectFileKind,
  validateFileContent,
  validateFileCount,
  validateFileSize,
} from "./validate-upload";
import { MAX_FILE_SIZE_BYTES } from "./constants";

describe("validateFileSize", () => {
  it("refuse un fichier vide", () => {
    expect(validateFileSize(0)).toEqual({ ok: false, error: "Fichier vide." });
  });

  it("refuse un fichier au-delà de la limite", () => {
    const result = validateFileSize(MAX_FILE_SIZE_BYTES + 1);
    expect(result.ok).toBe(false);
  });

  it("accepte un fichier dans la limite", () => {
    expect(validateFileSize(MAX_FILE_SIZE_BYTES)).toEqual({ ok: true });
  });
});

describe("validateFileCount", () => {
  it("refuse un envoi sans fichier", () => {
    const result = validateFileCount({
      existingCount: 0,
      incomingCount: 0,
      maxCount: 10,
    });
    expect(result).toEqual({ ok: false, error: "Aucun fichier sélectionné." });
  });

  it("refuse si le total dépasse la limite", () => {
    const result = validateFileCount({
      existingCount: 8,
      incomingCount: 3,
      maxCount: 10,
    });
    expect(result.ok).toBe(false);
  });

  it("accepte si le total reste dans la limite", () => {
    const result = validateFileCount({
      existingCount: 8,
      incomingCount: 2,
      maxCount: 10,
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("detectFileKind", () => {
  it("détecte un PDF via son en-tête %PDF-", () => {
    const buffer = Buffer.concat([
      Buffer.from("%PDF-1.7\n", "latin1"),
      Buffer.alloc(10),
    ]);
    expect(detectFileKind(buffer)).toBe("application/pdf");
  });

  it("détecte un JPEG via ses octets magiques FF D8 FF", () => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(detectFileKind(buffer)).toBe("image/jpeg");
  });

  it("détecte un PNG via sa signature", () => {
    const buffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
    ]);
    expect(detectFileKind(buffer)).toBe("image/png");
  });

  it("détecte un WEBP via RIFF/WEBP", () => {
    const buffer = Buffer.concat([
      Buffer.from("RIFF", "latin1"),
      Buffer.from([0x00, 0x00, 0x00, 0x00]),
      Buffer.from("WEBP", "latin1"),
    ]);
    expect(detectFileKind(buffer)).toBe("image/webp");
  });

  it("renvoie null pour un contenu non reconnu (ex: texte brut renommé en .pdf)", () => {
    const buffer = Buffer.from("ceci n'est pas un fichier valide", "utf-8");
    expect(detectFileKind(buffer)).toBeNull();
  });
});

describe("validateFileContent", () => {
  it("refuse un contenu dont la signature ne correspond à aucun type accepté", () => {
    const result = validateFileContent(Buffer.from("texte quelconque"));
    expect(result.ok).toBe(false);
  });

  it("accepte un contenu PDF et renvoie le mimeType détecté", () => {
    const buffer = Buffer.from("%PDF-1.4\n%...", "latin1");
    const result = validateFileContent(buffer);
    expect(result).toEqual({ ok: true, mimeType: "application/pdf" });
  });
});
