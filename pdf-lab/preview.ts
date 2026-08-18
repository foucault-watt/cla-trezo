import { spawnSync } from "node:child_process";
import { access, mkdir, readdir, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { renderPdfTemplate } from "./render";

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolvePdfToPpm() {
  if (process.env.PDFTOPPM_PATH) {
    return process.env.PDFTOPPM_PATH;
  }

  if (process.platform === "win32") {
    const bundled = path.join(
      os.homedir(),
      ".cache",
      "codex-runtimes",
      "codex-primary-runtime",
      "dependencies",
      "native",
      "poppler",
      "Library",
      "bin",
      "pdftoppm.exe",
    );
    if (await exists(bundled)) {
      return bundled;
    }
  }

  return "pdftoppm";
}

async function clearOldPreviews(directory: string) {
  const files = await readdir(directory, { withFileTypes: true });
  await Promise.all(
    files
      .filter((file) => file.isFile() && /^page-\d+\.png$/u.test(file.name))
      .map((file) => unlink(path.join(directory, file.name))),
  );
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    throw new Error(
      "Indiquez le slug du template. Exemple : npm run pdf:preview -- ndf-fn-sb",
    );
  }

  const { outputFile, template } = await renderPdfTemplate(slug);
  const previewDirectory = path.resolve(process.cwd(), "tmp", "pdfs", slug);
  const outputPrefix = path.join(previewDirectory, "page");

  await mkdir(previewDirectory, { recursive: true });
  await clearOldPreviews(previewDirectory);

  const command = await resolvePdfToPpm();
  const result = spawnSync(
    command,
    ["-png", "-r", "96", outputFile, outputPrefix],
    { encoding: "utf8" },
  );

  if (result.error || result.status !== 0) {
    throw new Error(
      result.error?.message ||
        result.stderr ||
        "La conversion du PDF en PNG a échoué. Installez Poppler ou définissez PDFTOPPM_PATH.",
    );
  }

  console.log(`PDF régénéré (${template.label}) : ${outputFile}`);
  console.log(`Aperçus temporaires : ${previewDirectory}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
