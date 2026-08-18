import type { SubsidyConventionPdfData } from "./types";

export const fixture: SubsidyConventionPdfData = {
  period: "2025-2026",
  firstParty: {
    associationName: "Centrale Lille Associations",
    address:
      "École Centrale de Lille, Cité Scientifique, BP 48, 59651 Villeneuve d'Ascq Cedex",
    representatives: [
      { name: "Monsieur Mathéo GUEFFIER", role: "Secrétaire général" },
      { name: "Monsieur Mathis MARCISET", role: "Trésorier" },
    ],
  },
  secondParty: {
    associationName: "AEEC Lille",
    address: "1 Cité Scientifique - CS 20048 - 59651 - Villeneuve d'Ascq Cedex",
    representatives: [
      { name: "Madame Yasmine SEMIANE", role: "Présidente" },
      { name: "Monsieur Alexandre CHEN", role: "Trésorier" },
    ],
  },
  expenses: [
    { grantedOn: "30/04/2026", description: "WEAC", amount: "650,00 €" },
    {
      grantedOn: "30/04/2026",
      description: "Journée de l'Institut",
      amount: "660,00 €",
    },
    {
      grantedOn: "30/04/2026",
      description: "Aprem BDE à la rez",
      amount: "440,00 €",
    },
  ],
  totalAmount: "1 750,00 €",
  firstPartySignature: {
    associationName: "Centrale Lille Associations",
    signatoryName: "Mathéo GUEFFIER",
    signatoryRole: "Secrétaire général",
    city: "Lille",
    date: "29/05/2026",
  },
  secondPartySignature: {
    associationName: "AEEC Lille",
    signatoryName: "Yasmine SEMIANE",
    signatoryRole: "Présidente",
    city: "Villeneuve d'Ascq",
    date: "25/05/2026",
  },
};
