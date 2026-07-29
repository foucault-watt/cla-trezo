import { notFound } from "next/navigation";
import type {
  AssoType,
  ExpenseReportStatus,
  FundingSourceType,
  SupportingDocumentType,
} from "@/app/generated/prisma/enums";
import { requireStructureAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  listVisibleSubventions,
  type VisibleSubvention,
} from "@/lib/subventions/visible-subventions";

export type ExpenseReportOverview = {
  id: string;
  title: string;
  description: string | null;
  status: ExpenseReportStatus;
  createdAt: Date;
  linesCount: number;
  totalAmountCents: number;
};

/**
 * Notes de frais de la Structure, tous statuts confondus (ce ticket ne crée
 * que des Brouillons, mais la liste doit rester correcte une fois la
 * soumission/validation ajoutées par des tickets ultérieurs).
 */
export async function listExpenseReports(
  assoSlug: string,
): Promise<ExpenseReportOverview[]> {
  const { structure } = await requireStructureAccess(assoSlug);

  const reports = await prisma.expenseReport.findMany({
    where: { assoId: structure.assoId },
    orderBy: { createdAt: "desc" },
    include: { lines: { select: { amountCents: true } } },
  });

  return reports.map((report) => ({
    id: report.id,
    title: report.title,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt,
    linesCount: report.lines.length,
    totalAmountCents: report.lines.reduce(
      (sum, line) => sum + line.amountCents,
      0,
    ),
  }));
}

export type ExpenseReportLineDetail = {
  id: string;
  beneficiaryFirstname: string;
  beneficiaryLastname: string;
  iban: string | null;
  amountCents: number;
  expenseName: string;
  typeDepenseId: string | null;
  typeDepenseLabel: string | null;
  customLabel: string | null;
  fundingSource: FundingSourceType;
  subventionId: string | null;
  subventionReason: string | null;
};

export type SupportingDocumentDetail = {
  id: string;
  type: SupportingDocumentType;
  originalFilename: string;
  mimeType: string;
  createdAt: Date;
};

export type ExpenseReportDetail = {
  id: string;
  title: string;
  description: string | null;
  status: ExpenseReportStatus;
  createdAt: Date;
  lines: ExpenseReportLineDetail[];
  supportingDocuments: SupportingDocumentDetail[];
};

export type TypeDepenseOption = { id: string; label: string };

export type ExpenseReportDetailContext = {
  report: ExpenseReportDetail;
  assoId: string;
  assoType: AssoType | null;
  typeDepenses: TypeDepenseOption[];
  visibleSubventions: VisibleSubvention[];
};

/**
 * Détail d'une Note de frais pour l'écran de saisie des Lignes : la Note
 * elle-même, le type de la Structure (pour savoir si "Solde" est une option
 * de source, cf. T11), la liste des Types de dépense, et les Subventions
 * Publiées visibles par la Structure.
 */
export async function getExpenseReportDetail(
  assoSlug: string,
  reportId: string,
): Promise<ExpenseReportDetailContext> {
  const { structure } = await requireStructureAccess(assoSlug);

  const [report, asso, typeDepenses, visibleSubventions] = await Promise.all([
    prisma.expenseReport.findUnique({
      where: { id: reportId },
      include: {
        lines: {
          orderBy: { createdAt: "asc" },
          include: {
            typeDepense: { select: { label: true } },
            subvention: { select: { reason: true } },
          },
        },
        supportingDocuments: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.asso.findUnique({
      where: { id: structure.assoId },
      select: { type: true },
    }),
    prisma.typeDepense.findMany({ orderBy: { label: "asc" } }),
    listVisibleSubventions(assoSlug),
  ]);

  if (!report || report.assoId !== structure.assoId) {
    notFound();
  }

  return {
    report: {
      id: report.id,
      title: report.title,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt,
      lines: report.lines.map((line) => ({
        id: line.id,
        beneficiaryFirstname: line.beneficiaryFirstname,
        beneficiaryLastname: line.beneficiaryLastname,
        iban: line.iban,
        amountCents: line.amountCents,
        expenseName: line.expenseName,
        typeDepenseId: line.typeDepenseId,
        typeDepenseLabel: line.typeDepense?.label ?? null,
        customLabel: line.customLabel,
        fundingSource: line.fundingSource,
        subventionId: line.subventionId,
        subventionReason: line.subvention?.reason ?? null,
      })),
      supportingDocuments: report.supportingDocuments.map((doc) => ({
        id: doc.id,
        type: doc.type,
        originalFilename: doc.originalFilename,
        mimeType: doc.mimeType,
        createdAt: doc.createdAt,
      })),
    },
    assoId: structure.assoId,
    assoType: asso?.type ?? null,
    typeDepenses: typeDepenses.map((t) => ({ id: t.id, label: t.label })),
    visibleSubventions,
  };
}
