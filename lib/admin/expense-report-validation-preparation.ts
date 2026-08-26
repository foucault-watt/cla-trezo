import { notFound } from "next/navigation";
import type { ExpenseReportStatus } from "@/app/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth/guards";
import {
  CLUB_BALANCE_FUNDING_GROUP_KEY,
  groupExpenseReportLinesByFundingSource,
} from "@/lib/expense-reports/expense-report-validation-grouping";
import { prisma } from "@/lib/prisma";
import type { ExpenseReportPdfData } from "@/pdf-lab/templates/ndf-fn-sb/types";
import type { ExpenseBalancePdfData } from "@/pdf-lab/templates/ndf-solde/types";
import { getConventionPdfSettings } from "./convention-pdf-settings";
import {
  buildSoldePdfData,
  buildSubventionPdfData,
  type PdfBeneficiaryContext,
} from "./expense-report-pdf-data";

export type SubventionValidationGroup = {
  key: string;
  kind: "SUBVENTION";
  subventionId: string;
  data: ExpenseReportPdfData;
};

export type ClubBalanceValidationGroup = {
  key: string;
  kind: "CLUB_BALANCE";
  subventionId: null;
  data: ExpenseBalancePdfData;
};

export type ExpenseReportValidationGroup =
  | SubventionValidationGroup
  | ClubBalanceValidationGroup;

export type ExpenseReportValidationPreparation = {
  reportId: string;
  status: ExpenseReportStatus;
  assoId: string;
  assoSlug: string;
  groups: ExpenseReportValidationGroup[];
};

/**
 * Charge une Note de frais et construit, pour chaque source de financement
 * distincte utilisée par ses Lignes, les données par défaut du PDF final
 * correspondant (ADR-0006) — via le regroupement pur
 * (expense-report-validation-grouping) puis les builders purs
 * (expense-report-pdf-data). Sert à la fois à la page d'aperçu Admin et,
 * indirectement, à connaître l'ensemble des groupes attendus lors de la
 * validation.
 */
export async function prepareExpenseReportValidation(
  reportId: string,
): Promise<ExpenseReportValidationPreparation> {
  await requireAdmin();

  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      status: true,
      assoId: true,
      beneficiaryFirstname: true,
      beneficiaryLastname: true,
      beneficiaryIban: true,
      asso: { select: { slug: true, name: true } },
      lines: {
        select: {
          id: true,
          amountCents: true,
          expenseDate: true,
          expenseName: true,
          fundingSource: true,
          subventionId: true,
        },
      },
    },
  });
  if (!report) notFound();

  const settings = await getConventionPdfSettings();
  const context: PdfBeneficiaryContext = {
    reportDate: new Date(),
    beneficiaryName:
      `${report.beneficiaryFirstname ?? ""} ${report.beneficiaryLastname ?? ""}`.trim(),
    associationName: report.asso.name,
    iban: report.beneficiaryIban,
    treasurerName: settings.claTreasurerName,
  };

  const fundingGroups = groupExpenseReportLinesByFundingSource(report.lines);

  const groups = await Promise.all(
    fundingGroups.map(
      async (group): Promise<ExpenseReportValidationGroup> => {
        if (group.kind === "CLUB_BALANCE") {
          return {
            key: CLUB_BALANCE_FUNDING_GROUP_KEY,
            kind: "CLUB_BALANCE",
            subventionId: null,
            data: buildSoldePdfData({
              context,
              lines: group.lines.map((line) => ({
                amountCents: line.amountCents,
                date: line.expenseDate,
                description: line.expenseName,
              })),
            }),
          };
        }

        const subvention = await prisma.subvention.findUniqueOrThrow({
          where: { id: group.subventionId },
          select: {
            reason: true,
            campaignId: true,
            campaign: { select: { name: true, publicationDate: true } },
          },
        });

        const [campaignSubventions, reimbursedMovements] = await Promise.all([
          prisma.subvention.findMany({
            where: { campaignId: subvention.campaignId, assoId: report.assoId },
            select: { reason: true, amountCents: true },
          }),
          prisma.financialMovement.findMany({
            where: {
              accountType: "SUBVENTION",
              origin: "EXPENSE_REPORT",
              subventionId: group.subventionId,
            },
            select: {
              amountCents: true,
              createdAt: true,
              expenseReportLine: { select: { expenseName: true } },
            },
          }),
        ]);

        return {
          key: group.subventionId,
          kind: "SUBVENTION",
          subventionId: group.subventionId,
          data: buildSubventionPdfData({
            context,
            campaignName: subvention.campaign.name,
            grantReason: subvention.reason,
            // Une Subvention n'est utilisable par une Structure que si sa
            // Campagne est Publiée (cf. listVisibleSubventionsForAsso), donc
            // toujours pourvue d'une publicationDate à ce stade.
            campaignGrantedOn: subvention.campaign.publicationDate as Date,
            campaignSubventions,
            reimbursedHistory: reimbursedMovements.map((movement) => ({
              amountCents: movement.amountCents,
              date: movement.createdAt,
              // origin: "EXPENSE_REPORT" garantit un expenseReportLineId, donc
              // cette relation, toujours renseignée (cf. financial_movement).
              description: movement.expenseReportLine!.expenseName,
            })),
            linesToReimburse: group.lines.map((line) => ({
              amountCents: line.amountCents,
              date: line.expenseDate,
              description: line.expenseName,
            })),
          }),
        };
      },
    ),
  );

  return {
    reportId: report.id,
    status: report.status,
    assoId: report.assoId,
    assoSlug: report.asso.slug,
    groups,
  };
}
