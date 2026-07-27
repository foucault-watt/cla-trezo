import sharp from "sharp";
import {
  MIME_TYPE_EXTENSIONS,
  isImageMimeType,
  type AllowedMimeType,
} from "./constants";

const MAX_DIMENSION_PX = 2000;
const COMPRESSION_SIZE_THRESHOLD_BYTES = 2 * 1024 * 1024; // 2 Mo
const JPEG_QUALITY = 82;

export type ProcessedFile = {
  buffer: Buffer;
  mimeType: AllowedMimeType;
  extension: string;
};

/**
 * Recompresse une image "trop grosse" (dimensions ou poids au-delà d'un
 * seuil) en JPEG redimensionné. Les PDF ne passent jamais par ici (appelant
 * responsable de ne pas les envoyer à cette fonction). Une image déjà petite
 * est renvoyée telle quelle, sans perte supplémentaire.
 */
export async function compressImageIfNeeded(
  buffer: Buffer,
  mimeType: AllowedMimeType,
): Promise<ProcessedFile> {
  if (!isImageMimeType(mimeType)) {
    return { buffer, mimeType, extension: MIME_TYPE_EXTENSIONS[mimeType] };
  }

  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const exceedsDimensions =
    width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX;
  const exceedsSize = buffer.length > COMPRESSION_SIZE_THRESHOLD_BYTES;

  if (!exceedsDimensions && !exceedsSize) {
    return { buffer, mimeType, extension: MIME_TYPE_EXTENSIONS[mimeType] };
  }

  const compressed = await sharp(buffer)
    .rotate()
    .resize({
      width: MAX_DIMENSION_PX,
      height: MAX_DIMENSION_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  return { buffer: compressed, mimeType: "image/jpeg", extension: "jpg" };
}
