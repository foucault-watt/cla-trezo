import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { compressImageIfNeeded } from "./image-processing";

describe("compressImageIfNeeded", () => {
  it("ne touche pas un PDF", async () => {
    const pdfLike = Buffer.from("%PDF-1.4 contenu", "latin1");

    const result = await compressImageIfNeeded(pdfLike, "application/pdf");

    expect(result.buffer.equals(pdfLike)).toBe(true);
    expect(result.mimeType).toBe("application/pdf");
    expect(result.extension).toBe("pdf");
  });

  it("laisse une petite image inchangée", async () => {
    const smallImage = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .png()
      .toBuffer();

    const result = await compressImageIfNeeded(smallImage, "image/png");

    expect(result.mimeType).toBe("image/png");
    expect(result.buffer.equals(smallImage)).toBe(true);
  });

  it("recompresse et redimensionne une image dont les dimensions dépassent le seuil", async () => {
    const bigImage = await sharp({
      create: {
        width: 2500,
        height: 3000,
        channels: 3,
        background: { r: 10, g: 20, b: 30 },
      },
    })
      .png()
      .toBuffer();

    const result = await compressImageIfNeeded(bigImage, "image/png");

    expect(result.mimeType).toBe("image/jpeg");
    expect(result.extension).toBe("jpg");

    const outMeta = await sharp(result.buffer).metadata();
    expect(outMeta.width).toBeLessThanOrEqual(2000);
    expect(outMeta.height).toBeLessThanOrEqual(2000);
  });

  it("recompresse une image dont le poids dépasse le seuil même avec des dimensions sous la limite", async () => {
    const width = 1800;
    const height = 1200;
    const noise = Buffer.alloc(width * height * 3);
    for (let i = 0; i < noise.length; i++) {
      noise[i] = Math.floor(Math.random() * 256);
    }
    const heavyImage = await sharp(noise, {
      raw: { width, height, channels: 3 },
    })
      .png({ compressionLevel: 0 })
      .toBuffer();
    expect(heavyImage.length).toBeGreaterThan(2 * 1024 * 1024);

    const result = await compressImageIfNeeded(heavyImage, "image/png");

    expect(result.mimeType).toBe("image/jpeg");
    expect(result.buffer.length).toBeLessThan(heavyImage.length);
  });
});
