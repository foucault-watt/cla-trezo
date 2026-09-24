/**
 * Données 100% statiques pour explorer des variantes de la page admin détail
 * d'association (/app/admin/associations/[assoSlug]). Rien ici n'est lu ni
 * écrit en base — cf. CONTEXT.md pour les vraies règles Club / Commission /
 * Association loi 1901 (Solde réservé aux Clubs, Convention réservée aux
 * Associations 1901, Ordre de financement pour Club/Commission).
 *
 * `initialized` simule les deux états qu'une structure fraîchement créée
 * traverse : Club sans encore de première Entrée manuelle, ou
 * Commission/Association 1901 sans encore de Subvention publiée.
 */

export type MockAssoType = "CLUB" | "ASSOCIATION_1901";

export type MockMovement = {
  id: string;
  date: string; // ISO
  type: "CREDIT" | "DEBIT";
  amountCents: number;
  label: string;
  category: string;
};

export type MockMember = {
  id: string;
  name: string;
  role: string;
  since: string; // ISO — début du mandat actuel (RefAssoUser.createdAt)
  // ISO — dernier UserLog.connectedAt. Toujours renseigné : on ne peut
  // apparaître dans cette liste qu'en s'étant connecté au moins une fois
  // (cf. lib/auth/cla.ts, syncUserFromCla ne traite que les rôles de la
  // personne qui se connecte). Peut être ancien si la personne n'est jamais
  // revenue depuis — et dans ce cas, son rôle actuel ici peut être obsolète
  // puisqu'il ne se met à jour qu'à sa prochaine connexion.
  lastLoginAt: string;
};

// Date de référence figée pour que la démo reste reproductible.
export const today = new Date("2026-09-06");
export const STALE_LOGIN_DAYS = 180;

export function daysSince(iso: string): number {
  return Math.floor(
    (today.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24),
  );
}

// Mêmes seuils que app/app/[assoSlug]/subventions/_components/subventions-ledger.tsx
// (bandes d'âge par publicationDate) — pour ne pas dérouler tout
// l'historique d'un coup côté admin non plus.
export const SUBVENTION_RECENT_DAYS = 365;
export const SUBVENTION_OLD_DAYS = 730;

export type SubventionAgeBand = "recent" | "old" | "history";

export function getSubventionAgeBand(dateIso: string): SubventionAgeBand {
  const days = daysSince(dateIso);
  if (days <= SUBVENTION_RECENT_DAYS) return "recent";
  if (days <= SUBVENTION_OLD_DAYS) return "old";
  return "history";
}

export type MockSubvention = {
  id: string;
  campagne: string;
  type: "CA_BUDGET" | "CA_EVENT" | "CA_EXCEPTIONNEL";
  montantCents: number;
  montantUtiliseCents: number;
  statut: "Publiée" | "En attente";
  date: string; // ISO
  document: { label: string; kind: "convention" | "ordre" };
};

export type MockNoteDeFrais = {
  id: string;
  beneficiaire: string;
  montantCents: number;
  statut: "En attente" | "Validée" | "Remboursée";
  date: string; // ISO
  fundingSource: "Solde" | "Subvention";
};

export const assoName = "Club Photo CLA";
export const asso1901Name = "Les Amis de CLA";

// Volontairement construit pour illustrer deux cas réels plutôt qu'un cas
// impossible : Camille vient de reprendre la présidence (mandat commencé le
// 05/09) et ne s'est connectée qu'une seule fois, ce jour-là — passation
// toute fraîche, pas une anomalie. Nabil, à l'inverse, n'a pas été revu
// depuis 8 mois : son rôle "Membre" ici peut très bien ne plus être exact,
// puisque rien ne le mettrait à jour tant qu'il ne se reconnecte pas
// lui-même.
export const members: MockMember[] = [
  {
    id: "u1",
    name: "Camille Dubreuil",
    role: "Présidente",
    since: "2026-09-05",
    lastLoginAt: "2026-09-05",
  },
  {
    id: "u2",
    name: "Adam Belkacem",
    role: "Trésorier",
    since: "2024-09-01",
    lastLoginAt: "2026-09-04",
  },
  {
    id: "u3",
    name: "Lina Fontaine",
    role: "Secrétaire",
    since: "2025-01-15",
    lastLoginAt: "2026-08-20",
  },
  {
    id: "u4",
    name: "Nabil Cherif",
    role: "Membre",
    since: "2025-09-10",
    lastLoginAt: "2026-01-12",
  },
];

const clubMovements: MockMovement[] = [
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
    date: "2026-08-12",
    type: "CREDIT",
    amountCents: 30000,
    label: "Subvention BDE — Rentrée",
    category: "Subvention",
  },
  {
    id: "m5",
    date: "2026-07-05",
    type: "CREDIT",
    amountCents: 20000,
    label: "Entrée manuelle — solde initial de l'année",
    category: "Ajustement",
  },
];

export const clubBalanceCents = clubMovements.reduce(
  (sum, m) => sum + (m.type === "CREDIT" ? m.amountCents : -m.amountCents),
  0,
);

// Un Club touche aussi des Subventions (elles n'alimentent jamais le Solde,
// cf. CONTEXT.md) — mais son document associé est un Ordre de financement,
// jamais une Convention (réservée à l'Association loi 1901). Les 3 dates
// couvrent volontairement les 3 bandes d'âge (récente / ancienne /
// historique) pour vérifier que le tri ne se contente pas des Subventions
// les plus vieilles.
const clubSubventions: MockSubvention[] = [
  {
    id: "s3",
    campagne: "CA Événement — Soirée d'intégration",
    type: "CA_EVENT",
    montantCents: 40000,
    montantUtiliseCents: 40000,
    statut: "Publiée",
    date: "2026-06-01",
    document: { label: "Ordre de financement", kind: "ordre" },
  },
  {
    id: "s6",
    campagne: "CA Budget — Automne 2024",
    type: "CA_BUDGET",
    montantCents: 100000,
    montantUtiliseCents: 100000,
    statut: "Publiée",
    date: "2024-10-15",
    document: { label: "Ordre de financement", kind: "ordre" },
  },
  {
    id: "s7",
    campagne: "CA Exceptionnel — Achat matériel 2023",
    type: "CA_EXCEPTIONNEL",
    montantCents: 60000,
    montantUtiliseCents: 60000,
    statut: "Publiée",
    date: "2023-03-10",
    document: { label: "Ordre de financement", kind: "ordre" },
  },
];

const subventions1901: MockSubvention[] = [
  {
    id: "s1",
    campagne: "CA Budget — Automne 2026",
    type: "CA_BUDGET",
    montantCents: 150000,
    montantUtiliseCents: 42000,
    statut: "Publiée",
    date: "2026-09-01",
    document: { label: "Convention de subvention", kind: "convention" },
  },
  {
    id: "s2",
    campagne: "CA Événement — Gala 2026",
    type: "CA_EVENT",
    montantCents: 50000,
    montantUtiliseCents: 50000,
    statut: "Publiée",
    date: "2026-05-12",
    document: { label: "Convention de subvention", kind: "convention" },
  },
  {
    id: "s4",
    campagne: "CA Budget — Automne 2024",
    type: "CA_BUDGET",
    montantCents: 120000,
    montantUtiliseCents: 120000,
    statut: "Publiée",
    date: "2024-11-20",
    document: { label: "Convention de subvention", kind: "convention" },
  },
  {
    id: "s5",
    campagne: "CA Événement — Gala 2022",
    type: "CA_EVENT",
    montantCents: 45000,
    montantUtiliseCents: 45000,
    statut: "Publiée",
    date: "2022-06-15",
    document: { label: "Convention de subvention", kind: "convention" },
  },
];

const clubNotesDeFrais: MockNoteDeFrais[] = [
  {
    id: "n1",
    beneficiaire: "Adam Belkacem",
    montantCents: 8900,
    statut: "En attente",
    date: "2026-09-03",
    fundingSource: "Solde",
  },
  {
    id: "n2",
    beneficiaire: "Camille Dubreuil",
    montantCents: 12500,
    statut: "Remboursée",
    date: "2026-08-27",
    fundingSource: "Solde",
  },
  {
    id: "n3",
    beneficiaire: "Nabil Cherif",
    montantCents: 4500,
    statut: "Validée",
    date: "2026-08-15",
    fundingSource: "Subvention",
  },
];

const asso1901NotesDeFrais: MockNoteDeFrais[] = [
  {
    id: "n4",
    beneficiaire: "Lina Fontaine",
    montantCents: 6200,
    statut: "En attente",
    date: "2026-09-02",
    fundingSource: "Subvention",
  },
  {
    id: "n5",
    beneficiaire: "Nabil Cherif",
    montantCents: 15000,
    statut: "Remboursée",
    date: "2026-06-10",
    fundingSource: "Subvention",
  },
];

export type ClubFixtures = {
  name: string;
  solde:
    | { status: "ready"; balanceCents: number; movements: MockMovement[] }
    | { status: "not_initialized" };
  subventions: MockSubvention[];
  notesDeFrais: MockNoteDeFrais[];
};

export type Asso1901Fixtures = {
  name: string;
  subventions: MockSubvention[];
  notesDeFrais: MockNoteDeFrais[];
};

export function getClubFixtures(initialized: boolean): ClubFixtures {
  return {
    name: assoName,
    solde: initialized
      ? {
          status: "ready",
          balanceCents: clubBalanceCents,
          movements: clubMovements,
        }
      : { status: "not_initialized" },
    subventions: initialized ? clubSubventions : [],
    notesDeFrais: initialized ? clubNotesDeFrais : [],
  };
}

export function getAsso1901Fixtures(initialized: boolean): Asso1901Fixtures {
  return {
    name: asso1901Name,
    subventions: initialized ? subventions1901 : [],
    notesDeFrais: initialized ? asso1901NotesDeFrais : [],
  };
}
