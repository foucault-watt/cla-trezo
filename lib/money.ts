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
