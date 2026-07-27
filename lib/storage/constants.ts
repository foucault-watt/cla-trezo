export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo par fichier
export const MAX_RECEIPT_FILES_PER_REPORT = 10;
export const MAX_HONOR_STATEMENT_FILES_PER_REPORT = 1;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const IMAGE_MIME_TYPES: readonly AllowedMimeType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MIME_TYPE_EXTENSIONS: Record<AllowedMimeType, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isAllowedMimeType(
  mimeType: string,
): mimeType is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isImageMimeType(mimeType: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}
