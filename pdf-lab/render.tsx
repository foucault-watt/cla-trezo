import { renderToFile } from "@react-pdf/renderer";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { getPdfTemplate, listPdfTemplates } from "./registry";

export function finalPdfPath(slug: string) {
  return path.resolve(process.cwd(), "output", "pdf", `${slug}.pdf`);
}

export async function renderPdfTemplate(slug: string) {
  const template = getPdfTemplate(slug);
  const outputFile = finalPdfPath(template.slug);

  await mkdir(path.dirname(outputFile), { recursive: true });
  await renderToFile(
    template.createFixtureDocument() as Parameters<typeof renderToFile>[0],
    outputFile,
  );

  return { outputFile, template };
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    const available = listPdfTemplates()
      .map((template) => template.slug)
      .join(", ");
    throw new Error(
      `Indiquez le slug du template. Exemple : npm run pdf:render -- ${available}`,
    );
  }

  const { outputFile, template } = await renderPdfTemplate(slug);
  console.log(`PDF généré (${template.label}) : ${outputFile}`);
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
