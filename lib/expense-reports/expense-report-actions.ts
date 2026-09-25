"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStructureMember } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile } from "@/lib/storage/file-storage";
import {
  assertExpenseReportTransition,
  ExpenseReportLifecycleError,
  type ExpenseReportActor,
} from "./expense-report-lifecycle";
import {
  addExpenseReportLine,
  beneficiaryData,
  deleteExpenseReportLine,
  resolveExpenseReportBeneficiary,
  revalidateExpenseReportScreens,
  updateExpenseReportBeneficiary,
  updateExpenseReportInfo,
  updateExpenseReportLine,
} from "./expense-report-commands";
import {
  rawLineFormValues,
  type ExpenseReportLineFormState,
} from "./expense-report-line-shared";
import {
  parseAddReimbursementForm,
  parseCreateExpenseReportForm,
  parseDeleteExpenseReportForm,
  parseUpdateExpenseReportForm,
  parseUpdateExpenseReportBeneficiaryForm,
  parseUpdateReimbursementForm,
} from "./expense-report-input";
export type { ExpenseReportLineFormValues } from "./expense-report-line-shared";

/*
 * Server Actions de l'espace Structure. Les modifications de contenu
 * (informations, bénéficiaire, Remboursements) sont des adapters vers
 * expense-report-commands.ts, partagé avec l'Admin : parser le formulaire,
 * résoudre l'acteur depuis la session (membre uniquement, cf.
 * requireStructureMember), appeler la commande. Création, soumission et
 * suppression d'un Brouillon n'existent que côté Structure et vivent ici.
 */

async function structureActor(
  assoSlug: string,
): Promise<Extract<ExpenseReportActor, { type: "STRUCTURE" }>> {
  const { structure } = await requireStructureMember(assoSlug);
  return { type: "STRUCTURE", assoId: structure.assoId };
}

function invalid(parsed: { error: z.ZodError }) {
  return {
    ok: false as const,
    error: parsed.error.issues[0]?.message ?? "Saisie invalide.",
  };
}

export type CreateExpenseReportState = {
  ok: boolean;
  error?: string;
  reportId?: string;
};

export async function createExpenseReportAction(
  _prevState: CreateExpenseReportState,
  formData: FormData,
): Promise<CreateExpenseReportState> {
  const parsed = parseCreateExpenseReportForm(formData);
  if (!parsed.success) return invalid(parsed);

  const { structure, user } = await requireStructureMember(
    parsed.data.assoSlug,
  );

  const report = await prisma.expenseReport.create({
    data: {
      assoId: structure.assoId,
      createdBy: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });

  revalidateExpenseReportScreens();

  return { ok: true, reportId: report.id };
}

export type UpdateExpenseReportState = { ok: boolean; error?: string };

export async function updateExpenseReportAction(
  _prevState: UpdateExpenseReportState,
  formData: FormData,
): Promise<UpdateExpenseReportState> {
  const parsed = parseUpdateExpenseReportForm(formData);
  if (!parsed.success) return invalid(parsed);

  return updateExpenseReportInfo(
    await structureActor(parsed.data.assoSlug),
    parsed.data,
  );
}

export type SubmitExpenseReportState = { ok: boolean; error?: string };

/**
 * Soumet la Note avec le bénéficiaire actuellement affiché dans le formulaire.
 * Identité, IBAN et statut sont écrits en une seule mise à jour : la
 * soumission ne peut donc jamais partir avec un bénéficiaire plus ancien
 * resté en base.
 */
export async function submitExpenseReportWithBeneficiaryAction(
  _prevState: SubmitExpenseReportState,
  formData: FormData,
): Promise<SubmitExpenseReportState> {
  const parsed = parseUpdateExpenseReportBeneficiaryForm(formData);
  if (!parsed.success) return invalid(parsed);

  const actor = await structureActor(parsed.data.assoSlug);
  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      assoId: true,
      status: true,
      beneficiaryUserId: true,
      beneficiaryFirstname: true,
      beneficiaryLastname: true,
      beneficiaryIban: true,
    },
  });
  if (!report || report.assoId !== actor.assoId) {
    return { ok: false, error: "Note de frais introuvable." };
  }

  try {
    assertExpenseReportTransition({
      from: report.status,
      to: "SUBMITTED",
      actor,
    });
  } catch (error) {
    if (!(error instanceof ExpenseReportLifecycleError)) throw error;
    return {
      ok: false,
      error: "Cette Note de frais n'est plus en Brouillon.",
    };
  }

  const resolved = await resolveExpenseReportBeneficiary({
    input: parsed.data,
    assoId: report.assoId,
    existing: report,
  });
  if (!resolved.ok) return resolved;

  const [datedLineCount, allLineCount, documentCount] = await Promise.all([
    prisma.expenseReportLine.count({
      where: { expenseReportId: report.id, expenseDate: { not: null } },
    }),
    prisma.expenseReportLine.count({
      where: { expenseReportId: report.id },
    }),
    prisma.supportingDocument.count({
      where: { expenseReportId: report.id },
    }),
  ]);
  if (datedLineCount === 0 || datedLineCount !== allLineCount) {
    return {
      ok: false,
      error: "Ajoutez au moins une Dépense datée avant de soumettre.",
    };
  }
  if (documentCount === 0) {
    return {
      ok: false,
      error:
        "Ajoutez au moins un Justificatif ou une Attestation sur l'honneur avant de soumettre.",
    };
  }

  await prisma.expenseReport.update({
    where: { id: report.id },
    data: {
      ...beneficiaryData(resolved.beneficiary),
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  revalidateExpenseReportScreens();
  return { ok: true };
}

export type DeleteExpenseReportState = { ok: boolean; error?: string };

/**
 * Supprime une Note de frais et son contenu (Lignes, Justificatifs). Limité
 * au statut Brouillon — plus strict que la règle de modification (qui
 * autorise aussi Soumise) : une suppression est irréversible, contrairement
 * aux autres modifications de ce statut.
 */
export async function deleteExpenseReportAction(
  _prevState: DeleteExpenseReportState,
  formData: FormData,
): Promise<DeleteExpenseReportState> {
  const parsed = parseDeleteExpenseReportForm(formData);
  if (!parsed.success) return invalid(parsed);

  const actor = await structureActor(parsed.data.assoSlug);

  const report = await prisma.expenseReport.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      assoId: true,
      status: true,
      supportingDocuments: { select: { filePath: true } },
    },
  });
  if (!report || report.assoId !== actor.assoId) {
    return { ok: false, error: "Note de frais introuvable." };
  }
  if (report.status !== "DRAFT") {
    return {
      ok: false,
      error: "Seul un Brouillon peut être supprimé.",
    };
  }

  await prisma.$transaction([
    prisma.expenseReportLine.deleteMany({
      where: { expenseReportId: report.id },
    }),
    prisma.supportingDocument.deleteMany({
      where: { expenseReportId: report.id },
    }),
    prisma.expenseReport.delete({ where: { id: report.id } }),
  ]);

  // Best-effort, en parallèle : la DB fait foi, un fichier orphelin est
  // toléré (pas de purge automatique en V1, cf. addSupportingDocumentsCore).
  await Promise.allSettled(
    report.supportingDocuments.map((document) =>
      deleteStoredFile(document.filePath),
    ),
  );

  revalidateExpenseReportScreens();

  // redirect() throws to let Next.js navigate directly from the action,
  // avoiding a client-side push racing the implicit refresh of the current
  // (now-deleted) report page, which would otherwise 404 first. Cette même
  // contrainte empêche d'afficher le toast de succès depuis le client (le
  // code après un redirect() serveur ne s'exécute jamais) : le message
  // transite donc par l'URL cible, lu et nettoyé par <ToastQueryFlag /> —
  // voir docs/agents/toasts.md.
  const toastParams = new URLSearchParams({
    toast: "Note de frais supprimée.",
    toastType: "success",
  });
  redirect(
    `/app/${parsed.data.assoSlug}/notes-de-frais?${toastParams.toString()}`,
  );
}

export type ReimbursementFormState = ExpenseReportLineFormState;

export async function addReimbursementAction(
  _prevState: ReimbursementFormState,
  formData: FormData,
): Promise<ReimbursementFormState> {
  const values = rawLineFormValues(formData);
  const parsed = parseAddReimbursementForm(formData);
  if (!parsed.success) return { ...invalid(parsed), values };

  const result = await addExpenseReportLine(
    await structureActor(parsed.data.assoSlug),
    parsed.data,
  );
  return result.ok ? result : { ...result, values };
}

export async function updateReimbursementAction(
  _prevState: ReimbursementFormState,
  formData: FormData,
): Promise<ReimbursementFormState> {
  const values = rawLineFormValues(formData);
  const parsed = parseUpdateReimbursementForm(formData);
  if (!parsed.success) return { ...invalid(parsed), values };

  const result = await updateExpenseReportLine(
    await structureActor(parsed.data.assoSlug),
    parsed.data,
  );
  return result.ok ? result : { ...result, values };
}

export type DeleteReimbursementState = { ok: boolean; error?: string };

const deleteReimbursementFormSchema = z.object({
  id: z.string().uuid(),
  assoSlug: z.string().min(1),
});

export async function deleteReimbursementAction(
  _prevState: DeleteReimbursementState,
  formData: FormData,
): Promise<DeleteReimbursementState> {
  const parsed = deleteReimbursementFormSchema.safeParse({
    id: formData.get("id"),
    assoSlug: formData.get("assoSlug"),
  });
  if (!parsed.success) return { ok: false, error: "Saisie invalide." };

  return deleteExpenseReportLine(
    await structureActor(parsed.data.assoSlug),
    parsed.data,
  );
}

export type UpdateExpenseReportBeneficiaryState = {
  ok: boolean;
  error?: string;
};

export async function updateExpenseReportBeneficiaryAction(
  _prevState: UpdateExpenseReportBeneficiaryState,
  formData: FormData,
): Promise<UpdateExpenseReportBeneficiaryState> {
  const parsed = parseUpdateExpenseReportBeneficiaryForm(formData);
  if (!parsed.success) return invalid(parsed);

  return updateExpenseReportBeneficiary(
    await structureActor(parsed.data.assoSlug),
    parsed.data,
  );
}
