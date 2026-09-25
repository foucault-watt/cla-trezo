import { revalidatePath } from "next/cache";
import type { z } from "zod";
import type { SupportingDocumentType } from "@/app/generated/prisma/enums";
import { toAmountCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import {
  isExpenseReportMutable,
  type ExpenseReportActor,
} from "./expense-report-lifecycle";
import type { reimbursementBaseSchema } from "./expense-report-input";
import { loadFundingSourceEligibility } from "./expense-report-line-shared";
import { loadExpenseLineWarnings } from "./line-warnings";
import {
  addSupportingDocumentsCore,
  removeSupportingDocumentCore,
} from "./supporting-document-shared";

/**
 * Modifications du contenu d'une Note de frais, communes à la Structure et à
 * l'Admin : les Server Actions de chaque espace (expense-report-actions.ts,
 * lib/admin/expense-report-actions.ts, et leurs équivalents Justificatifs) se
 * contentent de parser le formulaire, de résoudre l'acteur depuis la session
 * puis d'appeler la commande. Ici vivent, une seule fois :
 * - le chargement de la Note, scopé à la Structure pour l'acteur STRUCTURE
 *   (une Note d'une autre Structure est « introuvable ») ;
 * - la règle de verrouillage par statut et par acteur (ADR-0001, cf.
 *   expense-report-lifecycle.ts) ;
 * - l'éligibilité de la source de financement et les Warnings ;
 * - le rafraîchissement des écrans des deux espaces.
 *
 * Pas de "use server" : ces fonctions ne doivent jamais être appelables
 * depuis le client sans passer par une action qui a vérifié la session.
 */

export type CommandResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export type ExpenseReportLineInput = z.output<typeof reimbursementBaseSchema>;

export type BeneficiaryInput = {
  beneficiaryKind: "MEMBER" | "CUSTOM";
  beneficiaryUserId: string | null;
  beneficiaryFirstname: string;
  beneficiaryLastname: string;
  /** Vide = conserver l'IBAN déjà saisi, si le bénéficiaire n'a pas changé. */
  beneficiaryIban: string;
};

const NOT_FOUND = "Note de frais introuvable.";
const LINE_NOT_FOUND = "Remboursement introuvable.";
const DOCUMENT_NOT_FOUND = "Justificatif introuvable.";
const LOCKED = "Cette Note de frais n'est plus modifiable.";

const reportSelect = {
  id: true,
  assoId: true,
  status: true,
  asso: { select: { slug: true } },
  beneficiaryUserId: true,
  beneficiaryFirstname: true,
  beneficiaryLastname: true,
  beneficiaryIban: true,
} as const;

type LoadedReport = {
  id: string;
  assoId: string;
  status: Parameters<typeof isExpenseReportMutable>[0]["status"];
  asso: { slug: string };
  beneficiaryUserId: string | null;
  beneficiaryFirstname: string | null;
  beneficiaryLastname: string | null;
  beneficiaryIban: string | null;
};

/**
 * Vérifie qu'une Note chargée est visible par l'acteur puis modifiable par
 * lui. `notFound` distingue « Note introuvable » de « Remboursement /
 * Justificatif introuvable » selon ce que l'appelant a cherché.
 */
function checkEditable(
  actor: ExpenseReportActor,
  report: LoadedReport | null | undefined,
  notFound: string,
): CommandResult<{ report: LoadedReport }> {
  if (
    !report ||
    (actor.type === "STRUCTURE" && report.assoId !== actor.assoId)
  ) {
    return { ok: false, error: notFound };
  }
  if (!isExpenseReportMutable({ status: report.status, actor })) {
    return { ok: false, error: LOCKED };
  }
  return { ok: true, report };
}

async function loadEditableReport(actor: ExpenseReportActor, id: string) {
  const report = await prisma.expenseReport.findUnique({
    where: { id },
    select: reportSelect,
  });
  return checkEditable(actor, report, NOT_FOUND);
}

async function loadEditableLine(actor: ExpenseReportActor, id: string) {
  const line = await prisma.expenseReportLine.findUnique({
    where: { id },
    select: { id: true, expenseReport: { select: reportSelect } },
  });
  const check = checkEditable(actor, line?.expenseReport, LINE_NOT_FOUND);
  return check.ok ? { ...check, lineId: line!.id } : check;
}

/**
 * Rafraîchit la Note dans les deux espaces : une modification de l'Admin doit
 * aussi apparaître côté Structure, et inversement. Motifs de route (et non
 * chemins littéraux) pour couvrir toutes les étapes du parcours, présentes
 * et futures, sans en tenir la liste.
 */
export function revalidateExpenseReportScreens() {
  revalidatePath("/app/[assoSlug]/notes-de-frais", "layout");
  revalidatePath("/app/admin/notes-de-frais", "layout");
}

export async function updateExpenseReportInfo(
  actor: ExpenseReportActor,
  input: { id: string; title: string; description: string | null },
): Promise<CommandResult> {
  const check = await loadEditableReport(actor, input.id);
  if (!check.ok) return check;

  await prisma.expenseReport.update({
    where: { id: check.report.id },
    data: { title: input.title, description: input.description },
  });
  revalidateExpenseReportScreens();
  return { ok: true };
}

export async function updateExpenseReportBeneficiary(
  actor: ExpenseReportActor,
  input: { id: string } & BeneficiaryInput,
): Promise<CommandResult> {
  const check = await loadEditableReport(actor, input.id);
  if (!check.ok) return check;

  const resolved = await resolveExpenseReportBeneficiary({
    input,
    assoId: check.report.assoId,
    existing: check.report,
  });
  if (!resolved.ok) return resolved;

  await prisma.expenseReport.update({
    where: { id: check.report.id },
    data: beneficiaryData(resolved.beneficiary),
  });
  revalidateExpenseReportScreens();
  return { ok: true };
}

export async function addExpenseReportLine(
  actor: ExpenseReportActor,
  input: { expenseReportId: string } & ExpenseReportLineInput,
): Promise<CommandResult<{ warnings: string[] }>> {
  const check = await loadEditableReport(actor, input.expenseReportId);
  if (!check.ok) return check;

  const prepared = await prepareLine(check.report, input);
  if (!prepared.ok) return prepared;

  await prisma.expenseReportLine.create({
    data: { expenseReportId: check.report.id, ...prepared.data },
  });
  revalidateExpenseReportScreens();
  return { ok: true, warnings: prepared.warnings };
}

export async function updateExpenseReportLine(
  actor: ExpenseReportActor,
  input: { id: string } & ExpenseReportLineInput,
): Promise<CommandResult<{ warnings: string[] }>> {
  const check = await loadEditableLine(actor, input.id);
  if (!check.ok) return check;

  const prepared = await prepareLine(check.report, input, check.lineId);
  if (!prepared.ok) return prepared;

  await prisma.expenseReportLine.update({
    where: { id: check.lineId },
    data: prepared.data,
  });
  revalidateExpenseReportScreens();
  return { ok: true, warnings: prepared.warnings };
}

export async function deleteExpenseReportLine(
  actor: ExpenseReportActor,
  input: { id: string },
): Promise<CommandResult> {
  const check = await loadEditableLine(actor, input.id);
  if (!check.ok) return check;

  // Sans risque pour FinancialMovement : il n'est créé qu'à la Validation, et
  // une Note Validée n'est plus modifiable (ADR-0003).
  await prisma.expenseReportLine.delete({ where: { id: check.lineId } });
  revalidateExpenseReportScreens();
  return { ok: true };
}

export async function addExpenseReportDocuments(
  actor: ExpenseReportActor,
  input: {
    expenseReportId: string;
    documentType: SupportingDocumentType;
    files: File[];
  },
): Promise<CommandResult> {
  const check = await loadEditableReport(actor, input.expenseReportId);
  if (!check.ok) return check;

  const result = await addSupportingDocumentsCore({
    report: { id: check.report.id, assoSlug: check.report.asso.slug },
    documentType: input.documentType,
    files: input.files,
  });
  if (!result.ok) return { ok: false, error: result.error ?? "Saisie invalide." };

  revalidateExpenseReportScreens();
  return { ok: true };
}

export async function removeExpenseReportDocument(
  actor: ExpenseReportActor,
  input: { id: string },
): Promise<CommandResult> {
  const document = await prisma.supportingDocument.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      filePath: true,
      expenseReport: { select: reportSelect },
    },
  });
  const check = checkEditable(actor, document?.expenseReport, DOCUMENT_NOT_FOUND);
  if (!check.ok) return check;

  await removeSupportingDocumentCore(document!);
  revalidateExpenseReportScreens();
  return { ok: true };
}

/**
 * Éligibilité de la source (même règle stricte pour l'Admin, pas de
 * passe-droit sur T11) puis Warnings — calculés avant l'écriture, sur la
 * Structure de la Note (jamais celle de l'URL).
 */
async function prepareLine(
  report: LoadedReport,
  input: ExpenseReportLineInput,
  excludeLineId?: string,
) {
  const eligibility = await loadFundingSourceEligibility({
    assoId: report.assoId,
    fundingSource: input.fundingSource,
    subventionId: input.subventionId,
  });
  if (!eligibility.ok) return eligibility;

  const amountCents = toAmountCents(input.amount);
  const warnings = await loadExpenseLineWarnings({
    assoId: report.assoId,
    expenseReportId: report.id,
    fundingSource: input.fundingSource,
    subventionId: input.subventionId,
    lineAmountCents: amountCents,
    excludeLineId,
  });

  return {
    ok: true as const,
    warnings,
    data: {
      expenseDate: input.expenseDate,
      amountCents,
      expenseName: input.expenseName,
      typeDepenseId: input.typeDepenseId,
      customLabel: input.customLabel,
      fundingSource: input.fundingSource,
      subventionId: input.subventionId,
    },
  };
}

export type ExistingBeneficiary = {
  beneficiaryUserId: string | null;
  beneficiaryFirstname: string | null;
  beneficiaryLastname: string | null;
  beneficiaryIban: string | null;
};

export type ResolvedBeneficiary = CommandResult<{
  beneficiary: {
    userId: string | null;
    firstname: string;
    lastname: string;
    iban: string;
  };
}>;

function normalizedIdentityPart(value: string | null) {
  return value?.trim().toLocaleLowerCase("fr-FR") ?? "";
}

/**
 * Résout personne + IBAN comme un seul invariant. Un IBAN existant ne peut
 * être réutilisé que si l'identité n'a pas changé ; cela évite d'associer le
 * compte bancaire d'un ancien bénéficiaire au nom d'un nouveau.
 */
export async function resolveExpenseReportBeneficiary({
  input,
  assoId,
  existing,
}: {
  input: BeneficiaryInput;
  assoId: string;
  existing: ExistingBeneficiary;
}): Promise<ResolvedBeneficiary> {
  let userId: string | null = null;
  let firstname = input.beneficiaryFirstname;
  let lastname = input.beneficiaryLastname;
  let sameIdentity = false;

  if (input.beneficiaryKind === "MEMBER") {
    const membership = await prisma.refAssoUser.findFirst({
      where: {
        assoId,
        userId: input.beneficiaryUserId as string,
        isActive: true,
      },
      select: {
        userId: true,
        user: { select: { firstname: true, lastname: true } },
      },
    });
    if (!membership) {
      return { ok: false, error: "Membre introuvable ou inactif." };
    }
    userId = membership.userId;
    firstname = membership.user.firstname;
    lastname = membership.user.lastname;
    sameIdentity = existing.beneficiaryUserId === membership.userId;
  } else {
    sameIdentity =
      existing.beneficiaryUserId === null &&
      normalizedIdentityPart(existing.beneficiaryFirstname) ===
        normalizedIdentityPart(firstname) &&
      normalizedIdentityPart(existing.beneficiaryLastname) ===
        normalizedIdentityPart(lastname);
  }

  const iban =
    input.beneficiaryIban || (sameIdentity ? existing.beneficiaryIban : null);
  if (!iban) {
    return {
      ok: false,
      error: "Renseignez l'IBAN du nouveau bénéficiaire.",
    };
  }

  return {
    ok: true,
    beneficiary: { userId, firstname, lastname, iban },
  };
}

/** Colonnes de la Note écrites pour un bénéficiaire résolu. */
export function beneficiaryData(beneficiary: {
  userId: string | null;
  firstname: string;
  lastname: string;
  iban: string;
}) {
  return {
    beneficiaryUserId: beneficiary.userId,
    beneficiaryFirstname: beneficiary.firstname,
    beneficiaryLastname: beneficiary.lastname,
    beneficiaryIban: beneficiary.iban,
  };
}
