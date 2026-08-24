import type { ExpenseBalancePdfData } from "./types";

export const fixture: ExpenseBalancePdfData = {
  reportDate: "JJ/MM/AAAA",
  authorName: "NOM Prénom",
  associationName: "Nom_du_Club",
  expenses: [
    { date: "JJ/MM/AAAA", description: "XXXXXXXXXX", amount: "0,00 €" },
  ],
  total: "0,00 €",
  paymentMethod: "transfer",
  iban: "",
  recipientName: "Prénom NOM",
  treasurerName: "Baptiste FRENAY",
};
