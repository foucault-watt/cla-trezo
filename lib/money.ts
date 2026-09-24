const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export function toAmountCents(amount: number): number {
  return Math.round(amount * 100);
}

export function formatCents(amountCents: number): string {
  return currencyFormatter.format(amountCents / 100);
}

/**
 * Variante de formatCents pour les PDF react-pdf : la police Montserrat
 * embarquée n'a pas les glyphes des espaces fines/insécables (U+202F,
 * U+00A0) qu'Intl.NumberFormat("fr-FR") utilise comme séparateurs, ce qui
 * fait se superposer les caractères suivants. On les remplace par des
 * espaces normales.
 */
export function formatCentsForPdf(amountCents: number): string {
  return formatCents(amountCents).replace(/[  ]/g, " ");
}
