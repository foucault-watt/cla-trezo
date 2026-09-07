import type {
  ExpenseReportStatus,
  FundingSourceType,
  SupportingDocumentType,
} from "@/app/generated/prisma/enums";

export type ExpenseReportLineDetail = {
  id: string;
  amountCents: number;
  expenseDate?: Date | null;
  expenseName: string;
  typeDepenseId: string | null;
  typeDepenseLabel: string | null;
  customLabel: string | null;
  fundingSource: FundingSourceType;
  subventionId: string | null;
  subventionReason: string | null;
  /** Warnings T13-T15 (cf. lib/expense-reports/line-warnings.ts), calculés à la volée par l'appelant — jamais stockés. Vide par défaut : mapExpenseReportToDetail ne les calcule pas elle-même (pure, sans accès DB). */
  warnings: string[];
};

export type SupportingDocumentDetail = {
  id: string;
  type: SupportingDocumentType;
  originalFilename: string;
  mimeType: string;
  createdAt: Date;
};

/**
 * Un PDF final (issue #20), un par source de financement distincte, généré
 * uniquement à la Validation (ADR-0006). Partagé par les vues Structure et
 * Admin — chacune le charge à part de `mapExpenseReportToDetail` (pas
 * toujours pertinent, ex : hors du statut Validée).
 */
export type ExpenseReportPdfDetail = {
  id: string;
  fundingSource: FundingSourceType;
  subventionReason: string | null;
};

export type ExpenseReportDetail = {
  id: string;
  title: string;
  description: string | null;
  status: ExpenseReportStatus;
  createdAt: Date;
  beneficiaryUserId: string | null;
  beneficiaryFirstname: string | null;
  beneficiaryLastname: string | null;
  /** Réservé à l'Admin ; la Structure ne reçoit que les quatre derniers caractères. */
  beneficiaryIban: string | null;
  beneficiaryIbanLast4: string | null;
  lines: ExpenseReportLineDetail[];
  supportingDocuments: SupportingDocumentDetail[];
};

type ExpenseReportLineRow = {
  id: string;
  amountCents: number;
  expenseDate?: Date | null;
  expenseName: string;
  typeDepenseId: string | null;
  typeDepense: { label: string } | null;
  customLabel: string | null;
  fundingSource: FundingSourceType;
  subventionId: string | null;
  subvention: { reason: string } | null;
};

type SupportingDocumentRow = {
  id: string;
  type: SupportingDocumentType;
  originalFilename: string;
  mimeType: string;
  createdAt: Date;
};

export type ExpenseReportRow = {
  id: string;
  title: string;
  description: string | null;
  status: ExpenseReportStatus;
  createdAt: Date;
  beneficiaryUserId?: string | null;
  beneficiaryFirstname?: string | null;
  beneficiaryLastname?: string | null;
  beneficiaryIban?: string | null;
  lines: ExpenseReportLineRow[];
  supportingDocuments: SupportingDocumentRow[];
};

export type MapExpenseReportToDetailOptions = {
  /** Inclut les champs réservés à l'Admin (ici : l'IBAN de chaque Ligne). */
  includeAdminFields: boolean;
};

/**
 * Mapping partagé ligne-Prisma-vers-DTO pour le détail d'une Note de frais,
 * utilisé à la fois par la lecture Structure et la lecture Admin (cf. #28).
 * L'IBAN (donnée sensible, cf. ADR-0002) n'est renvoyé que pour l'Admin :
 * la Structure connaît déjà son propre IBAN et n'a pas besoin de le revoir ici.
 */
export function mapExpenseReportToDetail(
  report: ExpenseReportRow,
  options: MapExpenseReportToDetailOptions,
): ExpenseReportDetail {
  return {
    id: report.id,
    title: report.title,
    description: report.description,
    status: report.status,
    createdAt: report.createdAt,
    beneficiaryUserId: report.beneficiaryUserId ?? null,
    beneficiaryFirstname: report.beneficiaryFirstname ?? null,
    beneficiaryLastname: report.beneficiaryLastname ?? null,
    beneficiaryIban: options.includeAdminFields
      ? (report.beneficiaryIban ?? null)
      : null,
    beneficiaryIbanLast4: report.beneficiaryIban?.slice(-4) ?? null,
    lines: report.lines.map(mapLineToDetail),
    supportingDocuments: report.supportingDocuments.map(
      mapSupportingDocumentToDetail,
    ),
  };
}

function mapLineToDetail(line: ExpenseReportLineRow): ExpenseReportLineDetail {
  return {
    id: line.id,
    amountCents: line.amountCents,
    expenseDate: line.expenseDate ?? null,
    expenseName: line.expenseName,
    typeDepenseId: line.typeDepenseId,
    typeDepenseLabel: line.typeDepense?.label ?? null,
    customLabel: line.customLabel,
    fundingSource: line.fundingSource,
    subventionId: line.subventionId,
    subventionReason: line.subvention?.reason ?? null,
    warnings: [],
  };
}

function mapSupportingDocumentToDetail(
  doc: SupportingDocumentRow,
): SupportingDocumentDetail {
  return {
    id: doc.id,
    type: doc.type,
    originalFilename: doc.originalFilename,
    mimeType: doc.mimeType,
    createdAt: doc.createdAt,
  };
}
