import { formatCentsForPdf } from "@/lib/money";

/*
 * Les lignes d'un Document d'octroi restent modifiables par l'Admin avant
 * génération (texte et montant), mais le total n'est jamais saisi : il est
 * toujours la somme des lignes. Partagé entre les formulaires de
 * préparation (recalcul à la frappe) et generateGrantDocumentAction, qui
 * recalcule le total côté serveur plutôt que de croire celui envoyé.
 */

/** "1 234,56 €" → 123456 ; `null` si le montant est illisible ou vide. */
export function parseGrantDocumentAmount(value: string): number | null {
  const normalized = value.replace(/[\s€]/g, "").replace(",", ".");
  if (normalized === "") return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

/** Total formaté pour le PDF ; `null` dès qu'un montant est illisible. */
export function grantDocumentTotal(
  expenses: readonly { amount: string }[],
): string | null {
  let totalCents = 0;
  for (const expense of expenses) {
    const cents = parseGrantDocumentAmount(expense.amount);
    if (cents === null) return null;
    totalCents += cents;
  }
  return formatCentsForPdf(totalCents);
}
