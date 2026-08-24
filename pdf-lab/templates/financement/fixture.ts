import type { FinancementPdfData } from "./types";

export const fixture: FinancementPdfData = {
  period: "2025-2026",
  associationName: "CLIC",
  associationStatus: "Club",
  requestContext: "financement lors du CA Evénement d’Avril",
  expenses: [
    {
      date: "30/04/2026",
      description: "Aprem - Simulateur de règles",
      amount: "128,90 €",
    },
  ],
  total: "128,90 €",
  usageDeadline: "30 juin de l’année 2027",
  responsibleName: "Oscar DURAND",
  secretaryName: "Mathéo GUEFFIER",
};
