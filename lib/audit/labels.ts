/** Libellés français du journal d'audit (cf. auditActionKey). */

const MODEL_LABELS: Record<string, string> = {
  ExpenseReport: "Note de frais",
  ExpenseReportLine: "Remboursement",
  SupportingDocument: "Justificatif",
  ExpenseReportPdf: "PDF de Note de frais",
  GrantDocument: "Document d'octroi",
  FinancialMovement: "Mouvement financier",
  Subvention: "Subvention",
  SubventionCampaign: "Campagne de subvention",
  TypeDepense: "Type de dépense",
  ConventionPdfSettings: "Paramètres PDF",
};

const OPERATION_LABELS: Record<string, string> = {
  create: "création",
  createMany: "création multiple",
  createManyAndReturn: "création multiple",
  update: "modification",
  updateMany: "modification multiple",
  updateManyAndReturn: "modification multiple",
  upsert: "création ou mise à jour",
  delete: "suppression",
  deleteMany: "suppression multiple",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "retour en Brouillon",
  SUBMITTED: "soumission",
  TAKEN_OVER: "prise en charge",
  FINALIZED: "validation",
  REJECTED: "rejet",
};

export function auditModelLabel(model: string): string {
  return MODEL_LABELS[model] ?? model;
}

/** « Note de frais · soumission », « Remboursement · suppression »… */
export function auditActionLabel(action: string): string {
  const separator = action.lastIndexOf(".");
  if (separator === -1) return action;
  const model = action.slice(0, separator);
  const verb = action.slice(separator + 1);
  return `${auditModelLabel(model)} · ${
    STATUS_LABELS[verb] ?? OPERATION_LABELS[verb] ?? verb
  }`;
}
