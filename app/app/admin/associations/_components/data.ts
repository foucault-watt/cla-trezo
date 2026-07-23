// TODO: replace with a real query against the `Asso` Prisma model once
// balances/subventions/factures aggregation is wired up.
export type MockAssociation = {
  slug: string;
  name: string;
  solde: number;
  subventionsEnCours: number;
  facturesEnAttente: number;
  statut: "a-jour" | "attention" | "bloque";
};

export const mockAssociations: MockAssociation[] = [
  { slug: "aeci", name: "AECI", solde: 4230, subventionsEnCours: 2, facturesEnAttente: 1, statut: "a-jour" },
  { slug: "bde", name: "BDE Centrale Lille", solde: 18120, subventionsEnCours: 4, facturesEnAttente: 3, statut: "a-jour" },
  { slug: "bda", name: "BDA", solde: -560, subventionsEnCours: 1, facturesEnAttente: 5, statut: "bloque" },
  { slug: "bds", name: "BDS", solde: 920, subventionsEnCours: 0, facturesEnAttente: 2, statut: "attention" },
  { slug: "junior-lille", name: "Centrale Lille Junior Conseil", solde: 32040, subventionsEnCours: 1, facturesEnAttente: 0, statut: "a-jour" },
  { slug: "forum-entreprises", name: "Forum Entreprises", solde: 210, subventionsEnCours: 3, facturesEnAttente: 4, statut: "attention" },
  { slug: "gala", name: "Gala Centrale Lille", solde: 5400, subventionsEnCours: 1, facturesEnAttente: 1, statut: "a-jour" },
  { slug: "robotique", name: "Club Robotique", solde: -1200, subventionsEnCours: 2, facturesEnAttente: 6, statut: "bloque" },
];

export const statutLabel: Record<MockAssociation["statut"], string> = {
  "a-jour": "À jour",
  attention: "Attention",
  bloque: "Bloqué",
};

export const statutBadgeClass: Record<MockAssociation["statut"], string> = {
  "a-jour": "badge-success",
  attention: "badge-warning",
  bloque: "badge-error",
};

export const statutDotClass: Record<MockAssociation["statut"], string> = {
  "a-jour": "bg-success",
  attention: "bg-warning",
  bloque: "bg-error",
};
