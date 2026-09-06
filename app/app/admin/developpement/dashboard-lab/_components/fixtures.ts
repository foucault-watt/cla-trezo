/**
 * Données 100% statiques pour explorer des variantes du Dashboard Structure
 * (/app/[assoSlug]) sans toucher au vrai back-end. Rien ici n'est enregistré
 * ni lu depuis Prisma — cf. lib/solde/solde.ts pour les vraies règles
 * (Solde réservé aux Club, cf. CONTEXT.md).
 *
 * L'application vit sur plusieurs années : sommer les Notes de frais ou les
 * Subventions depuis l'origine donnerait des montants qui grossissent sans
 * fin et perdent leur sens. Les indicateurs "en plus" sont donc scopés aux
 * 365 derniers jours (cf. WINDOW_DAYS) ; seul le Solde reste une vraie somme
 * cumulée, puisque c'est un solde bancaire réel, pas un compteur d'activité.
 */

export const WINDOW_DAYS = 365;

// Date de référence figée pour que la démo reste reproductible.
export const today = new Date("2026-09-06");

export type MockMovement = {
  id: string;
  date: string; // ISO
  type: "CREDIT" | "DEBIT";
  amountCents: number;
  label: string;
  category: string;
};

export type MockActivity = {
  id: string;
  date: string; // ISO
  kind: "solde" | "note-de-frais" | "subvention";
  label: string;
  detail: string;
};

// Mouvements des 365 derniers jours, affichés par défaut dans l'historique.
const clubMovementsRecent: MockMovement[] = [
  {
    id: "m1",
    date: "2026-09-04",
    type: "DEBIT",
    amountCents: 8900,
    label: "Achat de fournitures",
    category: "Matériel",
  },
  {
    id: "m2",
    date: "2026-09-01",
    type: "CREDIT",
    amountCents: 15000,
    label: "Cotisations rentrée",
    category: "Cotisations",
  },
  {
    id: "m3",
    date: "2026-08-27",
    type: "DEBIT",
    amountCents: 12500,
    label: "Note de frais — Julie Marchand",
    category: "Remboursement",
  },
  {
    id: "m4",
    date: "2026-08-19",
    type: "DEBIT",
    amountCents: 4200,
    label: "Location de salle",
    category: "Événement",
  },
  {
    id: "m5",
    date: "2026-08-12",
    type: "CREDIT",
    amountCents: 30000,
    label: "Subvention BDE — Rentrée",
    category: "Subvention",
  },
  {
    id: "m6",
    date: "2026-08-03",
    type: "DEBIT",
    amountCents: 6700,
    label: "Impression affiches",
    category: "Communication",
  },
  {
    id: "m7",
    date: "2026-07-29",
    type: "DEBIT",
    amountCents: 21000,
    label: "Note de frais — Adam Belkacem",
    category: "Remboursement",
  },
  {
    id: "m8",
    date: "2026-07-22",
    type: "CREDIT",
    amountCents: 5000,
    label: "Vente de goodies",
    category: "Recette",
  },
  {
    id: "m9",
    date: "2026-07-14",
    type: "DEBIT",
    amountCents: 3300,
    label: "Buffet réunion de rentrée",
    category: "Événement",
  },
  {
    id: "m10",
    date: "2026-07-05",
    type: "CREDIT",
    amountCents: 20000,
    label: "Entrée manuelle — solde initial de l'année",
    category: "Ajustement",
  },
];

// Mouvements plus anciens qu'un an : comptent dans le Solde (vraie somme
// cumulée) mais restent hors de l'historique par défaut — cf. le lien
// "Historique antérieur" dans chaque variante.
const clubMovementsOlder: MockMovement[] = [
  {
    id: "m11",
    date: "2025-01-10",
    type: "CREDIT",
    amountCents: 40000,
    label: "Subvention BDE — Hiver 2025",
    category: "Subvention",
  },
  {
    id: "m12",
    date: "2024-09-20",
    type: "DEBIT",
    amountCents: 15000,
    label: "Achat matériel sono",
    category: "Matériel",
  },
  {
    id: "m13",
    date: "2024-01-05",
    type: "CREDIT",
    amountCents: 20000,
    label: "Entrée manuelle — solde initial",
    category: "Ajustement",
  },
];

export const clubMovements: MockMovement[] = [
  ...clubMovementsRecent,
  ...clubMovementsOlder,
];

// Le Solde est un vrai solde bancaire : toujours la somme de tout
// l'historique, jamais fenêtrée.
export const clubBalanceCents = clubMovements.reduce(
  (sum, m) => sum + (m.type === "CREDIT" ? m.amountCents : -m.amountCents),
  0,
);

export const clubMovementsLast365Days = clubMovementsRecent;
export const clubOlderMovementsCount = clubMovementsOlder.length;

export const notesDeFraisStats = {
  enAttente: 2,
  totalLast365Days: 7,
  montantTotalLast365DaysCents: 48200,
};

export const subventionsStats = {
  actives: 2,
  montantRestantLast365DaysCents: 42000,
  montantTotalLast365DaysCents: 70000,
  campagnesAnterieuresCount: 3,
  prochaine: {
    campagne: "CA Budget — Automne 2026",
    date: "2026-10-15",
  },
};

export const recentActivity: MockActivity[] = [
  {
    id: "a1",
    date: "2026-09-04",
    kind: "solde",
    label: "Achat de fournitures",
    detail: "-89,00 €",
  },
  {
    id: "a2",
    date: "2026-09-02",
    kind: "note-de-frais",
    label: "Note de frais soumise",
    detail: "Julie Marchand — 125,00 €",
  },
  {
    id: "a3",
    date: "2026-09-01",
    kind: "solde",
    label: "Cotisations rentrée",
    detail: "+150,00 €",
  },
  {
    id: "a4",
    date: "2026-08-28",
    kind: "subvention",
    label: "Subvention publiée",
    detail: "CA Budget — Été 2026",
  },
  {
    id: "a5",
    date: "2026-08-27",
    kind: "solde",
    label: "Note de frais remboursée",
    detail: "-125,00 €",
  },
  {
    id: "a6",
    date: "2026-08-19",
    kind: "note-de-frais",
    label: "Note de frais validée",
    detail: "Adam Belkacem — 210,00 €",
  },
];

export type MockAssoType = "CLUB" | "STRUCTURE";
