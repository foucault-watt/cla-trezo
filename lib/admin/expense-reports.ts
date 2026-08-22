import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { mapExpenseReportToDetail } from "@/lib/expense-reports/expense-report-detail-mapping";
import type {
  ExpenseReportLineDetail,
  SupportingDocumentDetail,
} from "@/lib/expense-reports/expense-report-detail-mapping";
import { attachLineWarnings } from "@/lib/expense-reports/line-warnings";
import type { TypeDepenseOption } from "@/lib/expense-reports/expense-reports";
import { listVisibleSubventionsForAdmin } from "@/lib/subventions/visible-subventions";
import type { VisibleSubvention } from "@/lib/subventions/visible-subventions";
import { getClubSoldeForAdmin } from "@/lib/solde/actions";
import type { SoldeView } from "@/lib/solde/solde";
import type {
  AssoType,
  ExpenseReportStatus,
} from "@/app/generated/prisma/enums";
export type { TypeDepenseOption } from "@/lib/expense-reports/expense-reports";

export type ExpenseReportOverviewForAdmin = {
  id: string;
  title: string;
  status: ExpenseReportStatus;
  createdAt: Date;
  assoName: string;
  linesCount: number;
  totalAmountCents: number;
};

/**
 * Notes de frais en attente de traitement (Soumises ou Prises en charge),
 * toutes Structures confondues — cf. T24.
 */
export async function listExpenseReportsForAdmin(): Promise<
  ExpenseReportOverviewForAdmin[]
> {
  await requireAdmin();

  const reports = await prisma.expenseReport.findMany({
    where: { status: { in: ["SUBMITTED", "TAKEN_OVER"] } },
    orderBy: { submittedAt: "asc" },
    include: {
      asso: { select: { name: true } },
      lines: { select: { amountCents: true } },
    },
  });

  return reports.map((report) => ({
    id: report.id,
    title: report.title,
    status: report.status,
    createdAt: report.createdAt,
    assoName: report.asso.name,
    linesCount: report.lines.length,
    totalAmountCents: report.lines.reduce(
      (sum, line) => sum + line.amountCents,
      0,
    ),
  }));
}

export type ExpenseReportDetailForAdmin = {
  id: string;
  title: string;
  description: string | null;
  status: ExpenseReportStatus;
  createdAt: Date;
  beneficiaryUserId: string | null;
  beneficiaryFirstname: string | null;
  beneficiaryLastname: string | null;
  beneficiaryIban: string | null;
  beneficiaryIbanLast4: string | null;
  assoId: string;
  assoName: string;
  assoSlug: string;
  assoType: AssoType | null;
  typeDepenses: TypeDepenseOption[];
  visibleSubventions: VisibleSubvention[];
  soldeView: SoldeView;
  lines: ExpenseReportLineDetail[];
  supportingDocuments: SupportingDocumentDetail[];
};

/**
 * Détail complet d'une Note de frais pour l'écran de consultation Admin :
 * l'Admin voit toutes les Structures, contrairement à la Structure qui ne
 * voit que ses propres notes (cf. lib/expense-reports/expense-reports.ts).
 * Charge en plus le type de la Structure, les Types de dépense et les
 * Subventions visibles — nécessaires pour que l'Admin puisse éditer les
 * Lignes d'une Note Prise en charge (#18), pas seulement les consulter.
 */
export async function getExpenseReportDetailForAdmin(
  reportId: string,
): Promise<ExpenseReportDetailForAdmin> {
  await requireAdmin();

  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
    include: {
      asso: { select: { name: true, slug: true, type: true } },
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
  });

  if (!report) {
    notFound();
  }

  const detail = mapExpenseReportToDetail(report, { includeAdminFields: true });
  const [typeDepenses, visibleSubventions, soldeView] = await Promise.all([
    prisma.typeDepense.findMany({ orderBy: { label: "asc" } }),
    listVisibleSubventionsForAdmin(report.assoId),
    getClubSoldeForAdmin(report.assoId),
  ]);

  return {
    ...detail,
    lines: await attachLineWarnings(
      report.assoId,
      detail.id,
      detail.status,
      detail.lines,
    ),
    assoId: report.assoId,
    assoName: report.asso.name,
    assoSlug: report.asso.slug,
    assoType: report.asso.type,
    typeDepenses: typeDepenses.map((t) => ({ id: t.id, label: t.label })),
    visibleSubventions,
    soldeView,
  };
}
