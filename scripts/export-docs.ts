/**
 * Assemble la documentation "humaine" du projet (README, PRODUCT, CONTEXT,
 * ADR, handover) en un seul fichier Markdown, pour remise à quelqu'un qui ne
 * clonera pas le repo (association CLA, futur repreneur non-dev).
 *
 * Les fichiers sources restent la référence vivante (modifiés au fil de
 * l'eau par les devs/agents) ; ce script ne fait que produire un instantané
 * daté. Le résultat n'est pas versionné (cf. .gitignore) — à régénérer à la
 * demande.
 *
 * Usage: npx tsx scripts/export-docs.ts
 *
 * Pour obtenir un vrai PDF à partir du Markdown généré, sans ajouter de
 * dépendance lourde au projet :
 *   npx md-to-pdf docs/export/dossier-trezo.md
 * (ou l'extension VS Code "Markdown PDF" sur le fichier ouvert).
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

const DOCS: { path: string; title: string }[] = [
  { path: "README.md", title: "Présentation & démarrage" },
  { path: "PRODUCT.md", title: "Produit" },
  { path: "CONTEXT.md", title: "Contexte métier & vocabulaire" },
  { path: "docs/handover.md", title: "Exploitation & passation" },
  { path: "docs/adr/0001-verrouillage-simple-note-de-frais.md", title: "ADR-0001 — Verrouillage simple des notes de frais" },
  { path: "docs/adr/0002-iban-non-persistant.md", title: "ADR-0002 — IBAN non persistant" },
  { path: "docs/adr/0003-immutabilite-post-pdf.md", title: "ADR-0003 — Immutabilité post-PDF" },
  { path: "docs/adr/0004-type-subvention-en-dur-type-depense-en-base.md", title: "ADR-0004 — Type de subvention en dur, type de dépense en base" },
  { path: "docs/adr/0005-solde-calcule-a-la-volee.md", title: "ADR-0005 — Solde calculé à la volée" },
  { path: "docs/adr/0006-un-pdf-final-par-source-de-financement.md", title: "ADR-0006 — Un PDF final par source de financement" },
];

const OUTPUT_DIR = join(ROOT, "docs", "export");
const OUTPUT_FILE = join(OUTPUT_DIR, "dossier-trezo.md");

function main() {
  const date = new Date().toISOString().slice(0, 10);

  const toc = DOCS.map((d, i) => `${i + 1}. ${d.title}`).join("\n");

  const sections = DOCS.map((d) => {
    const fullPath = join(ROOT, d.path);
    let content: string;
    try {
      content = readFileSync(fullPath, "utf-8");
    } catch {
      console.warn(`⚠ Fichier manquant, ignoré : ${d.path}`);
      return null;
    }
    return `\n\n---\n\n# ${d.title}\n\n${content.trim()}`;
  }).filter((s): s is string => s !== null);

  const output = [
    `# Trézo — Dossier de documentation`,
    ``,
    `_Généré le ${date} à partir des fichiers Markdown du repo. Ceci est un instantané : la version à jour vit dans le repo Git (README.md, PRODUCT.md, CONTEXT.md, docs/)._`,
    ``,
    `## Sommaire`,
    ``,
    toc,
    sections.join(""),
  ].join("\n");

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, output, "utf-8");
  console.log(`Écrit : ${OUTPUT_FILE}`);
}

main();
