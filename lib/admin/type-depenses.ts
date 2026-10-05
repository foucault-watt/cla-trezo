import { prisma } from "@/lib/prisma";
import { groupCustomLabels, type CustomLabelUsage } from "./type-depense-labels";

export type TypeDepenseAdminRow = {
  id: string;
  label: string;
  reimbursementCount: number;
};

export type TypeDepensesAdminView = {
  types: TypeDepenseAdminRow[];
  customLabels: CustomLabelUsage[];
};

/**
 * Types de dépense proposés aux Structures, et libellés personnalisés
 * qu'elles ont saisis faute de Type adapté. Le compteur d'un Type inclut
 * toutes les Notes, démo comprise : c'est lui qui décide si une suppression
 * exige un Type de remplacement. Les libellés personnalisés excluent en
 * revanche les Structures de démo, comme les autres listings Admin.
 */
export async function getTypeDepensesAdminView(): Promise<TypeDepensesAdminView> {
  const [types, customLines] = await Promise.all([
    prisma.typeDepense.findMany({
      orderBy: { label: "asc" },
      select: {
        id: true,
        label: true,
        _count: { select: { expenseReportLines: true } },
      },
    }),
    prisma.expenseReportLine.findMany({
      where: {
        customLabel: { not: null },
        expenseReport: { asso: { isDemo: false } },
      },
      select: {
        customLabel: true,
        expenseReportId: true,
        expenseReport: { select: { asso: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    types: types.map((type) => ({
      id: type.id,
      label: type.label,
      reimbursementCount: type._count.expenseReportLines,
    })),
    customLabels: groupCustomLabels(
      customLines.flatMap((line) =>
        line.customLabel
          ? [
              {
                customLabel: line.customLabel,
                expenseReportId: line.expenseReportId,
                assoName: line.expenseReport.asso.name,
              },
            ]
          : [],
      ),
      types,
    ),
  };
}
