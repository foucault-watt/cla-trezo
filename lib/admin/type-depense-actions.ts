"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { pluralize } from "@/lib/plural";
import {
  parseCustomLabelReclassForm,
  parseTypeDepenseCreateForm,
  parseTypeDepenseDeleteForm,
  parseTypeDepenseUpdateForm,
} from "./type-depense-input";
import { findTypeDepenseByLabel } from "./type-depense-labels";

const ADMIN_PAGE_PATH = "/app/admin/types-de-depense";

export type TypeDepenseActionState = {
  ok: boolean;
  error?: string;
  /** Message de succès à afficher en toast. */
  message?: string;
};

function invalidInput(issues: { message: string }[]): TypeDepenseActionState {
  return { ok: false, error: issues[0]?.message ?? "Saisie invalide." };
}

function reimbursements(count: number) {
  return pluralize(count, "Remboursement");
}

/**
 * Ajoute un Type de dépense à la liste proposée aux Structures. Refusé si un
 * Type équivalent existe déjà, même avec une casse ou des accents différents.
 */
export async function createTypeDepenseAction(
  _prevState: TypeDepenseActionState,
  formData: FormData,
): Promise<TypeDepenseActionState> {
  await requireAdmin();

  const parsed = parseTypeDepenseCreateForm(formData);
  if (!parsed.success) return invalidInput(parsed.error.issues);

  const types = await prisma.typeDepense.findMany({
    select: { id: true, label: true },
  });
  const duplicate = findTypeDepenseByLabel(types, parsed.data.label);
  if (duplicate) {
    return {
      ok: false,
      error: `Le Type de dépense « ${duplicate.label} » existe déjà.`,
    };
  }

  await prisma.typeDepense.create({ data: { label: parsed.data.label } });
  revalidatePath(ADMIN_PAGE_PATH);

  return { ok: true, message: `Type de dépense « ${parsed.data.label} » ajouté.` };
}

/**
 * Renomme un Type de dépense. Le nouveau nom s'applique partout où le Type
 * est utilisé, Notes validées comprises (cf. ADR-0010). Un nom déjà pris par
 * un autre Type est refusé : fusionner deux Types passe par la suppression
 * avec remplacement.
 */
export async function updateTypeDepenseAction(
  _prevState: TypeDepenseActionState,
  formData: FormData,
): Promise<TypeDepenseActionState> {
  await requireAdmin();

  const parsed = parseTypeDepenseUpdateForm(formData);
  if (!parsed.success) return invalidInput(parsed.error.issues);

  const types = await prisma.typeDepense.findMany({
    select: { id: true, label: true },
  });
  if (!types.some((type) => type.id === parsed.data.id)) {
    return { ok: false, error: "Type de dépense introuvable." };
  }
  const duplicate = findTypeDepenseByLabel(
    types,
    parsed.data.label,
    parsed.data.id,
  );
  if (duplicate) {
    return {
      ok: false,
      error: `Le Type de dépense « ${duplicate.label} » existe déjà. Pour fusionner les deux, supprimez celui-ci en choisissant « ${duplicate.label} » comme remplacement.`,
    };
  }

  await prisma.typeDepense.update({
    where: { id: parsed.data.id },
    data: { label: parsed.data.label },
  });
  revalidatePath(ADMIN_PAGE_PATH);

  return { ok: true, message: "Type de dépense renommé." };
}

/**
 * Supprime un Type de dépense. S'il est utilisé, un Type de remplacement est
 * obligatoire et ses Remboursements y sont rattachés dans la même
 * transaction : la clé étrangère passerait sinon à NULL et laisserait des
 * Remboursements sans Type ni libellé personnalisé.
 */
export async function deleteTypeDepenseAction(
  _prevState: TypeDepenseActionState,
  formData: FormData,
): Promise<TypeDepenseActionState> {
  await requireAdmin();

  const parsed = parseTypeDepenseDeleteForm(formData);
  if (!parsed.success) return invalidInput(parsed.error.issues);
  const { id, replacementTypeDepenseId } = parsed.data;

  const type = await prisma.typeDepense.findUnique({
    where: { id },
    select: { label: true, _count: { select: { expenseReportLines: true } } },
  });
  if (!type) {
    return { ok: false, error: "Type de dépense introuvable." };
  }

  const usageCount = type._count.expenseReportLines;
  if (usageCount === 0) {
    await prisma.typeDepense.delete({ where: { id } });
    revalidatePath(ADMIN_PAGE_PATH);
    return { ok: true, message: `Type de dépense « ${type.label} » supprimé.` };
  }

  if (!replacementTypeDepenseId) {
    return {
      ok: false,
      error: `Ce Type de dépense est utilisé par ${reimbursements(usageCount)} : choisissez un Type de remplacement.`,
    };
  }
  if (replacementTypeDepenseId === id) {
    return {
      ok: false,
      error: "Le Type de remplacement doit être différent du Type supprimé.",
    };
  }
  const replacement = await prisma.typeDepense.findUnique({
    where: { id: replacementTypeDepenseId },
    select: { label: true },
  });
  if (!replacement) {
    return { ok: false, error: "Type de remplacement introuvable." };
  }

  const [moved] = await prisma.$transaction([
    prisma.expenseReportLine.updateMany({
      where: { typeDepenseId: id },
      data: { typeDepenseId: replacementTypeDepenseId },
    }),
    prisma.typeDepense.delete({ where: { id } }),
  ]);
  revalidatePath(ADMIN_PAGE_PATH);

  return {
    ok: true,
    message: `Type de dépense « ${type.label} » supprimé : ${reimbursements(moved.count)} rattaché(s) à « ${replacement.label} ».`,
  };
}

/**
 * Reclasse tous les Remboursements portant un libellé personnalisé donné :
 * soit en le renommant (il reste personnalisé), soit en leur imposant un
 * Type de dépense existant. Un nouveau nom équivalent à un Type existant
 * rattache directement les Remboursements à ce Type plutôt que de créer un
 * doublon personnalisé. S'applique aussi aux Notes validées (cf. ADR-0010).
 */
export async function reclassCustomLabelAction(
  _prevState: TypeDepenseActionState,
  formData: FormData,
): Promise<TypeDepenseActionState> {
  await requireAdmin();

  const parsed = parseCustomLabelReclassForm(formData);
  if (!parsed.success) return invalidInput(parsed.error.issues);
  const input = parsed.data;

  // Exactement l'un des deux est renseigné : le Type imposé, ou le nouveau
  // libellé personnalisé.
  let target: { id: string; label: string } | undefined;
  let renamedLabel: string | null = null;
  if (input.mode === "TYPE") {
    const type = await prisma.typeDepense.findUnique({
      where: { id: input.typeDepenseId },
      select: { id: true, label: true },
    });
    if (!type) {
      return { ok: false, error: "Type de dépense introuvable." };
    }
    target = type;
  } else {
    const types = await prisma.typeDepense.findMany({
      select: { id: true, label: true },
    });
    target = findTypeDepenseByLabel(types, input.newLabel);
    if (!target && input.newLabel === input.customLabel) {
      return {
        ok: false,
        error: "Le nouveau libellé est identique à l'actuel.",
      };
    }
    if (!target) renamedLabel = input.newLabel;
  }

  const result = await prisma.expenseReportLine.updateMany({
    where: { customLabel: input.customLabel, typeDepenseId: null },
    data: target
      ? { typeDepenseId: target.id, customLabel: null }
      : { customLabel: renamedLabel },
  });

  if (result.count === 0) {
    return {
      ok: false,
      error: "Ce libellé personnalisé n'est plus utilisé par aucun Remboursement.",
    };
  }
  revalidatePath(ADMIN_PAGE_PATH);

  if (target) {
    const prefix =
      input.mode === "RENAME"
        ? `« ${input.newLabel} » correspond au Type de dépense « ${target.label} » : `
        : "";
    return {
      ok: true,
      message: `${prefix}${reimbursements(result.count)} rattaché(s) au Type « ${target.label} ».`,
    };
  }
  return {
    ok: true,
    message: `Libellé renommé : ${reimbursements(result.count)} mis à jour.`,
  };
}
