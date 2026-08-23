import { notFound } from "next/navigation";
import type {
  AssoType,
  ExpenseReportStatus,
} from "@/app/generated/prisma/enums";
import { requireStructureAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  listVisibleSubventions,
  type VisibleSubvention,
} from "@/lib/subventions/visible-subventions";
import {
  mapExpenseReportToDetail,
  type ExpenseReportDetail,
} from "@/lib/expense-reports/expense-report-detail-mapping";
import {
  attachLineWarnings,
  isSubventionWithinFundingWindow,
} from "@/lib/expense-reports/line-warnings";
export type {
  ExpenseReportLineDetail,
  SupportingDocumentDetail,
  ExpenseReportDetail,
} from "@/lib/expense-reports/expense-report-detail-mapping";

export type ExpenseReportOverview = {
  id: string;
  title: string;
  description: string | null;
  status: ExpenseReportStatus;
  createdAt: Date;
  linesCount: number;
  totalAmountCents: number;
  beneficiaryFirstname: string | null;
  beneficiaryLastname: string | null;
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
    beneficiaryFirstname: report.beneficiaryFirstname,
    beneficiaryLastname: report.beneficiaryLastname,
  }));
}

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

  const detail = mapExpenseReportToDetail(report, {
    includeAdminFields: false,
  });
  const now = new Date();

  return {
    report: {
      ...detail,
      lines: await attachLineWarnings(
        structure.assoId,
        detail.id,
        detail.status,
        detail.lines,
      ),
    },
    assoId: structure.assoId,
    assoType: asso?.type ?? null,
    typeDepenses: typeDepenses.map((t) => ({ id: t.id, label: t.label })),
    // Restreint au panneau de sélection lors de l'ajout d'une Ligne : la
    // page /subventions dédiée (T7) affiche tout l'historique publié, sans
    // limite d'âge (cf. lib/subventions/visible-subventions.ts).
    visibleSubventions: visibleSubventions.filter((s) =>
      isSubventionWithinFundingWindow(s.campaignDate, now),
    ),
  };
}
