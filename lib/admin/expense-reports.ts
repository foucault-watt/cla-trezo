import { cache } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { EXCLUDE_DEMO_ASSO_RELATION } from "@/lib/auth/demo-config";
import { prisma } from "@/lib/prisma";
import {
  assertExpenseReportMutable,
  ExpenseReportLifecycleError,
} from "@/lib/expense-reports/expense-report-lifecycle";
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
  FundingSourceType,
} from "@/app/generated/prisma/enums";
export type { TypeDepenseOption } from "@/lib/expense-reports/expense-reports";

export type ExpenseReportOverviewForAdmin = {
  id: string;
  title: string;
  status: ExpenseReportStatus;
  createdAt: Date;
  assoName: string;
  beneficiaryFirstname: string | null;
  beneficiaryLastname: string | null;
  linesCount: number;
  totalAmountCents: number;
};

/**
 * Notes de frais déjà soumises par une Structure (donc plus en Brouillon),
 * toutes Structures confondues — cf. T24. Inclut les Notes déjà traitées
 * (Validée, Rejetée) pour que l'Admin puisse les retrouver après coup, pas
 * seulement celles encore en attente de traitement.
 */
export async function listExpenseReportsForAdmin(): Promise<
  ExpenseReportOverviewForAdmin[]
> {
  await requireAdmin();

  const reports = await prisma.expenseReport.findMany({
    where: {
      status: { in: ["SUBMITTED", "TAKEN_OVER", "FINALIZED", "REJECTED"] },
      ...EXCLUDE_DEMO_ASSO_RELATION,
    },
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
    beneficiaryFirstname: report.beneficiaryFirstname,
    beneficiaryLastname: report.beneficiaryLastname,
    linesCount: report.lines.length,
    totalAmountCents: report.lines.reduce(
      (sum, line) => sum + line.amountCents,
      0,
    ),
  }));
}

export type ExpenseReportPdfDetail = {
  id: string;
  fundingSource: FundingSourceType;
  subventionReason: string | null;
};

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
  /** Un PDF par source de financement distincte, généré à la Validation (ADR-0006). Vide tant que la Note n'est pas Validée. */
  pdfs: ExpenseReportPdfDetail[];
};

/**
 * Une Note n'est modifiable par l'Admin qu'une fois Prise en charge (cf.
 * assertExpenseReportMutable, ADR-0001) : Soumise (avant prise en charge),
 * Finalisée ou Rejetée sont donc toutes en lecture seule côté Admin.
 */
export function isExpenseReportEditableByAdmin(
  status: ExpenseReportStatus,
): boolean {
  try {
    assertExpenseReportMutable({ status, actor: { type: "ADMIN" } });
    return true;
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return false;
  }
}

/**
 * Détail complet d'une Note de frais pour l'écran de consultation Admin :
 * l'Admin voit toutes les Structures, contrairement à la Structure qui ne
 * voit que ses propres notes (cf. lib/expense-reports/expense-reports.ts).
 * Charge en plus le type de la Structure, les Types de dépense et les
 * Subventions visibles — nécessaires pour que l'Admin puisse éditer les
 * Lignes d'une Note Prise en charge (#18), pas seulement les consulter.
 *
 * Enveloppé dans `cache()` : le layout du wizard Admin et la page de l'étape
 * courante appellent chacun cette fonction pour la même Note dans un même
 * rendu — sans ça, chaque navigation déclencherait la requête (et ses
 * appels associés) deux fois.
 */
export const getExpenseReportDetailForAdmin = cache(async function (
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
      pdfs: {
        orderBy: { createdAt: "asc" },
        include: { subvention: { select: { reason: true } } },
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
    pdfs: report.pdfs.map((pdf) => ({
      id: pdf.id,
      fundingSource: pdf.fundingSource,
      subventionReason: pdf.subvention?.reason ?? null,
    })),
  };
});
