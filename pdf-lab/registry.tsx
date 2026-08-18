import type { ReactElement } from "react";
import { SubsidyConventionDocument } from "./templates/convention/document";
import { fixture as subsidyConventionFixture } from "./templates/convention/fixture";
import { ExpenseReportDocument } from "./templates/ndf-fn-sb/document";
import { fixture as expenseReportFixture } from "./templates/ndf-fn-sb/fixture";

export type PdfTemplateDefinition = {
  slug: string;
  label: string;
  createFixtureDocument: () => ReactElement;
};

const templates: Record<string, PdfTemplateDefinition> = {
  convention: {
    slug: "convention",
    label: "Convention de subvention",
    createFixtureDocument: () => (
      <SubsidyConventionDocument data={subsidyConventionFixture} />
    ),
  },
  "ndf-fn-sb": {
    slug: "ndf-fn-sb",
    label: "Note de frais FN_SB",
    createFixtureDocument: () => (
      <ExpenseReportDocument data={expenseReportFixture} />
    ),
  },
};

export function getPdfTemplate(slug: string): PdfTemplateDefinition {
  const template = templates[slug];
  if (!template) {
    const available = Object.keys(templates).sort().join(", ");
    throw new Error(
      `Template PDF inconnu : ${slug}. Templates disponibles : ${available}`,
    );
  }
  return template;
}

export function listPdfTemplates(): PdfTemplateDefinition[] {
  return Object.values(templates).sort((left, right) =>
    left.slug.localeCompare(right.slug),
  );
}
