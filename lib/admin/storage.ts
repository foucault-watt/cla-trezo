import type { AssoStatus, AssoType } from "@/app/generated/prisma/enums";
import { EXCLUDE_DEMO_ASSO } from "@/lib/auth/demo-config";
import { prisma } from "@/lib/prisma";

export type ArchiveCheckResult = {
  totalCount: number;
  availableCount: number;
  missingCount: number;
};

export type AssoStorageOverview = {
  id: string;
  slug: string;
  name: string;
  type: AssoType | null;
  status: AssoStatus;
  supportingDocumentsCount: number;
  pdfsCount: number;
  reportsWithFilesCount: number;
  yearsSpan: { min: number; max: number } | null;
};

type AssoStorageSource = {
  id: string;
  slug: string;
  name: string;
  type: AssoType | null;
  status: AssoStatus;
  expenseReports: {
    createdAt: Date;
    _count: { supportingDocuments: number; pdfs: number };
  }[];
};

/**
 * Vue d'ensemble Admin du stockage de documents, par Structure : sert de base
 * à l'onglet Stockage (nombre de fichiers, étendue en années) et au choix de
 * quelle Structure archiver.
 */
export function toStorageOverview(asso: AssoStorageSource): AssoStorageOverview {
  const reportsWithFiles = asso.expenseReports.filter(
    (report) =>
      report._count.supportingDocuments + report._count.pdfs > 0,
  );

  const supportingDocumentsCount = asso.expenseReports.reduce(
    (sum, report) => sum + report._count.supportingDocuments,
    0,
  );
  const pdfsCount = asso.expenseReports.reduce(
    (sum, report) => sum + report._count.pdfs,
    0,
  );

  const years = reportsWithFiles.map((report) => report.createdAt.getFullYear());
  const yearsSpan =
    years.length > 0
      ? { min: Math.min(...years), max: Math.max(...years) }
      : null;

  return {
    id: asso.id,
    slug: asso.slug,
    name: asso.name,
    type: asso.type,
    status: asso.status,
    supportingDocumentsCount,
    pdfsCount,
    reportsWithFilesCount: reportsWithFiles.length,
    yearsSpan,
  };
}

export async function listAssoStorageOverview(): Promise<
  AssoStorageOverview[]
> {
  const assos = await prisma.asso.findMany({
    where: EXCLUDE_DEMO_ASSO,
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      status: true,
      expenseReports: {
        select: {
          createdAt: true,
          _count: { select: { supportingDocuments: true, pdfs: true } },
        },
      },
    },
  });

  return assos.map(toStorageOverview);
}

export type ExpenseReportArchiveSource = {
  id: string;
  title: string;
  createdAt: Date;
  supportingDocuments: { filePath: string; originalFilename: string }[];
  pdfs: {
    filePath: string;
    subvention: { reason: string } | null;
  }[];
};

export type AssoArchiveSource = {
  name: string;
  expenseReports: ExpenseReportArchiveSource[];
};

export async function getAssoArchiveSource(
  slug: string,
): Promise<AssoArchiveSource | null> {
  const asso = await prisma.asso.findFirst({
    where: { slug, ...EXCLUDE_DEMO_ASSO },
    select: {
      name: true,
      expenseReports: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          supportingDocuments: {
            select: { filePath: true, originalFilename: true },
          },
          pdfs: {
            select: {
              filePath: true,
              subvention: { select: { reason: true } },
            },
          },
        },
      },
    },
  });

  return asso;
}

export type ArchiveEntry = { name: string; filePath: string };

/**
 * Nettoie un segment de nom de fichier/dossier destiné à un chemin d'entrée
 * dans le zip généré : un titre de Note de frais ou un nom de fichier
 * d'origine est du texte libre, potentiellement porteur de `/`/`\` qui
 * créerait des sous-dossiers non voulus dans l'archive.
 */
export function sanitizeArchiveSegment(value: string): string {
  const cleaned = value.replace(/[\\/]+/g, "-").trim();
  return cleaned.length > 0 ? cleaned : "sans-titre";
}

/**
 * Construit la liste des entrées du zip d'historique d'une Structure, à
 * partir des Justificatifs et PDF finaux de toutes ses Notes de frais.
 * Organisé par année puis par Note de frais, avec des noms lisibles plutôt
 * que les UUID utilisés sur le disque (cf. lib/storage/file-storage.ts).
 * Fonction pure (aucun accès disque/DB) pour rester testable simplement.
 */
export function buildAssoArchiveEntries(asso: {
  expenseReports: ExpenseReportArchiveSource[];
}): ArchiveEntry[] {
  const entries: ArchiveEntry[] = [];

  for (const report of asso.expenseReports) {
    if (
      report.supportingDocuments.length === 0 &&
      report.pdfs.length === 0
    ) {
      continue;
    }

    const year = report.createdAt.getFullYear();
    const reportFolder = `${year}/${sanitizeArchiveSegment(report.title)} (${report.id.slice(0, 8)})`;

    for (const doc of report.supportingDocuments) {
      entries.push({
        name: `${reportFolder}/${sanitizeArchiveSegment(doc.originalFilename)}`,
        filePath: doc.filePath,
      });
    }

    for (const [index, pdf] of report.pdfs.entries()) {
      const label = pdf.subvention
        ? `PDF - Subvention - ${sanitizeArchiveSegment(pdf.subvention.reason)}`
        : "PDF - Solde du club";
      // Suffixe par position seulement en cas de doublon (même libellé pour
      // deux PDF, en théorie rarissime) pour ne jamais faire écraser une
      // entrée par une autre dans le zip.
      const isDuplicateLabel =
        report.pdfs.filter(
          (other, otherIndex) =>
            otherIndex < index &&
            (other.subvention?.reason ?? null) === (pdf.subvention?.reason ?? null),
        ).length > 0;
      const name = isDuplicateLabel ? `${label} (${index + 1}).pdf` : `${label}.pdf`;
      entries.push({ name: `${reportFolder}/${name}`, filePath: pdf.filePath });
    }
  }

  return entries;
}
