import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { SubsidyConventionDocument } from "@/pdf-lab/templates/convention/document";
import type { SubsidyConventionPdfData } from "@/pdf-lab/templates/convention/types";
import { FinancementDocument } from "@/pdf-lab/templates/financement/document";
import type { FinancementPdfData } from "@/pdf-lab/templates/financement/types";

/**
 * Seul point de rendu des Documents d'octroi — le seam mocké en test (le
 * rendu réel de @react-pdf/renderer n'est jamais invoqué dans la suite).
 */
export async function renderConventionPdf(
  data: SubsidyConventionPdfData,
): Promise<Buffer> {
  const document = React.createElement(SubsidyConventionDocument, {
    data,
  }) as unknown as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(document);
}

export async function renderOrdreDeFinancementPdf(
  data: FinancementPdfData,
): Promise<Buffer> {
  const document = React.createElement(FinancementDocument, {
    data,
  }) as unknown as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(document);
}
