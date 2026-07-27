import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import type {
  ExpenseReportLineDetail,
  SupportingDocumentDetail,
} from "@/lib/expense-reports/expense-reports";
import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";

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
    id: report.id,
    title: report.title,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt,
    assoName: report.asso.name,
    assoSlug: report.asso.slug,
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
  };
}
