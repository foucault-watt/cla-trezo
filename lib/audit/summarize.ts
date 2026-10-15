/*
 * Règles pures de l'audit : quelles écritures Prisma sont journalisées et ce
 * qu'on en garde (cf. lib/prisma.ts pour le branchement, lib/audit/record.ts
 * pour l'écriture). Le journal ne stocke jamais de valeur saisie — seulement
 * les noms des champs modifiés et le statut atteint — pour qu'aucun IBAN ni
 * montant n'y survive 10 ans à la donnée qu'il décrit.
 */

/** Modèles métier audités. User, Asso et RefAssoUser sont tenus par la
 * synchro SSO, et les tables d'analytics/audit ne s'auditent pas elles-mêmes. */
export const AUDITED_MODELS = new Set([
  "ExpenseReport",
  "ExpenseReportLine",
  "SupportingDocument",
  "ExpenseReportPdf",
  "GrantDocument",
  "FinancialMovement",
  "Subvention",
  "SubventionCampaign",
  "TypeDepense",
  "ConventionPdfSettings",
]);

export const MUTATION_OPERATIONS = new Set([
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
  "delete",
  "deleteMany",
]);

export function isAuditedMutation(
  model: string | undefined,
  operation: string,
): model is string {
  return (
    model !== undefined &&
    AUDITED_MODELS.has(model) &&
    MUTATION_OPERATIONS.has(operation)
  );
}

export type MutationSummary = {
  model: string;
  operation: string;
  action: string;
  entityId: string | null;
  assoId: string | null;
  details: { fields?: string[]; status?: string; count?: number } | null;
};

type Record_ = Record<string, unknown>;

function asRecord(value: unknown): Record_ | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record_)
    : null;
}

function stringField(record: Record_ | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" ? value : null;
}

/** Données écrites, quelle que soit la forme de l'opération. */
function writtenData(operation: string, args: Record_ | null): Record_[] {
  if (!args) return [];
  if (operation === "upsert") {
    return [asRecord(args.create), asRecord(args.update)].filter(
      (record): record is Record_ => record !== null,
    );
  }
  if (Array.isArray(args.data)) {
    return args.data.map(asRecord).filter((r): r is Record_ => r !== null);
  }
  const data = asRecord(args.data);
  return data ? [data] : [];
}

/**
 * Clé lisible de l'écriture : le statut atteint quand l'écriture en fixe un
 * (« ExpenseReport.SUBMITTED »), l'opération Prisma sinon
 * (« ExpenseReportLine.create »).
 */
export function auditActionKey(
  model: string,
  operation: string,
  args: unknown,
): string {
  if (operation.startsWith("update") || operation === "upsert") {
    const status = writtenData(operation, asRecord(args))
      .map((data) => stringField(data, "status"))
      .find((value) => value !== null);
    if (status) return `${model}.${status}`;
  }
  return `${model}.${operation}`;
}

export function summarizeMutation({
  model,
  operation,
  args,
  result,
}: {
  model: string;
  operation: string;
  args: unknown;
  result: unknown;
}): MutationSummary {
  const argsRecord = asRecord(args);
  const resultRecord = asRecord(result);
  const where = asRecord(argsRecord?.where);
  const data = writtenData(operation, argsRecord);

  const fields = [...new Set(data.flatMap((record) => Object.keys(record)))]
    .sort();
  const status =
    data.map((record) => stringField(record, "status")).find(Boolean) ??
    undefined;
  const count =
    typeof resultRecord?.count === "number"
      ? resultRecord.count
      : Array.isArray(result)
        ? result.length
        : undefined;

  const details: NonNullable<MutationSummary["details"]> = {};
  if (fields.length > 0) details.fields = fields;
  if (status) details.status = status;
  if (count !== undefined) details.count = count;

  return {
    model,
    operation,
    action: auditActionKey(model, operation, args),
    entityId: stringField(resultRecord, "id") ?? stringField(where, "id"),
    assoId:
      stringField(resultRecord, "assoId") ??
      data.map((record) => stringField(record, "assoId")).find(Boolean) ??
      stringField(where, "assoId"),
    details: Object.keys(details).length > 0 ? details : null,
  };
}
