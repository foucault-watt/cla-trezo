import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  type AllowedMimeType,
} from "./constants";
import { pluralize } from "@/lib/plural";

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateFileSize(sizeBytes: number): ValidationResult {
  if (sizeBytes <= 0) {
    return { ok: false, error: "Fichier vide." };
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `Chaque fichier doit faire moins de ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} Mo.`,
    };
  }
  return { ok: true };
}

export function validateFileCount({
  existingCount,
  incomingCount,
  maxCount,
}: {
  existingCount: number;
  incomingCount: number;
  maxCount: number;
}): ValidationResult {
  if (incomingCount === 0) {
    return { ok: false, error: "Aucun fichier sélectionné." };
  }
  if (existingCount + incomingCount > maxCount) {
    return {
      ok: false,
      error: `Maximum ${pluralize(maxCount, "fichier")} par Note de frais.`,
    };
  }
  return { ok: true };
}

/**
 * Détecte le vrai type d'un fichier à partir de ses premiers octets plutôt
 * que de faire confiance au `mimeType` déclaré par le navigateur (contrôlable
 * par l'appelant, cf. guide Server Actions : traiter FormData comme non
 * fiable).
 */
export function detectFileKind(buffer: Buffer): AllowedMimeType | null {
  if (
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString("latin1") === "%PDF-"
  ) {
    return "application/pdf";
  }
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
    buffer.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function validateFileContent(
  buffer: Buffer,
): { ok: true; mimeType: AllowedMimeType } | { ok: false; error: string } {
  const detected = detectFileKind(buffer);
  if (!detected || !ALLOWED_MIME_TYPES.includes(detected)) {
    return {
      ok: false,
      error:
        "Format de fichier non accepté (PDF, JPEG, PNG ou WEBP uniquement).",
    };
  }
  return { ok: true, mimeType: detected };
}
