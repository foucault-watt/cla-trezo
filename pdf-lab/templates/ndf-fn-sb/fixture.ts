import type { ExpenseReportPdfData } from "./types";

export const fixture: ExpenseReportPdfData = {
  reportDate: "JJ/MM/AAAA",
  authorName: "NOM Prénom",
  fundingName: "Nom_du_Financement",
  grantName: "Nom_de_la_Subvention",
  associationName: "Nom_du_CLUB",
  grantedExpenses: [
    { date: "JJ_MM_AAAA", description: "XXXXXXXXXX", amount: "0,00 €" },
    { date: "JJ_MM_AAAA", description: "XXXXXXXXXX", amount: "0,00 €" },
  ],
  grantedTotal: "0,00 €",
  grantBalance: "0,00 €",
  paymentMethod: "transfer",
  iban: "",
  recipientName: "Prénom NOM",
  treasurerName: "Prénom NOM",
};
