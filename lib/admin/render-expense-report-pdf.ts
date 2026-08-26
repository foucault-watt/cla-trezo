import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ExpenseReportDocument } from "@/pdf-lab/templates/ndf-fn-sb/document";
import type { ExpenseReportPdfData } from "@/pdf-lab/templates/ndf-fn-sb/types";
import { ExpenseBalanceDocument } from "@/pdf-lab/templates/ndf-solde/document";
import type { ExpenseBalancePdfData } from "@/pdf-lab/templates/ndf-solde/types";

/**
 * Seul point de rendu PDF appelé par la Server Action de validation — le
 * seam mocké en test (le rendu réel de @react-pdf/renderer n'est jamais
 * invoqué dans la suite de tests).
 */
export async function renderSubventionPdf(
  data: ExpenseReportPdfData,
): Promise<Buffer> {
  const document = React.createElement(ExpenseReportDocument, {
    data,
  }) as unknown as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(document);
}

export async function renderSoldePdf(
  data: ExpenseBalancePdfData,
): Promise<Buffer> {
  const document = React.createElement(ExpenseBalanceDocument, {
    data,
  }) as unknown as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(document);
}
