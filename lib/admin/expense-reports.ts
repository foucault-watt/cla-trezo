import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { mapExpenseReportToDetail } from "@/lib/expense-reports/expense-report-detail-mapping";
import type {
  ExpenseReportLineDetail,
  SupportingDocumentDetail,
} from "@/lib/expense-reports/expense-report-detail-mapping";
import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";

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
  assoName: string;
  assoSlug: string;
  lines: ExpenseReportLineDetail[];
  supportingDocuments: SupportingDocumentDetail[];
};

/**
 * Détail complet d'une Note de frais pour l'écran de consultation Admin :
 * l'Admin voit toutes les Structures, contrairement à la Structure qui ne
 * voit que ses propres notes (cf. lib/expense-reports/expense-reports.ts).
 */
export async function getExpenseReportDetailForAdmin(
  reportId: string,
): Promise<ExpenseReportDetailForAdmin> {
  await requireAdmin();

  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
    include: {
      asso: { select: { name: true, slug: true } },
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

  return {
    ...mapExpenseReportToDetail(report, { includeAdminFields: true }),
    assoName: report.asso.name,
    assoSlug: report.asso.slug,
  };
}
