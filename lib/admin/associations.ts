import { cache } from "react";
import type { AssoStatus, AssoType } from "@/app/generated/prisma/enums";
import { EXCLUDE_DEMO_ASSO } from "@/lib/auth/demo-config";
import {
  listExpenseReportsForAsso,
  type ExpenseReportOverviewForAsso,
} from "@/lib/admin/expense-reports";
import {
  listAssoMembersWithLogin,
  type AssoMemberWithLogin,
} from "@/lib/asso/members";
import { prisma } from "@/lib/prisma";
import {
  computeSolde,
  soldeMovementSelect,
  type SoldeView,
} from "@/lib/solde/solde";
import {
  listVisibleSubventionsForAdmin,
  type VisibleSubvention,
} from "@/lib/subventions/visible-subventions";

export type AssoOverview = {
  id: string;
  slug: string;
  name: string;
  type: AssoType | null;
  status: AssoStatus;
  solde: SoldeView;
  subventionsPubliees: number;
  notesDeFraisEnAttente: number;
};

/**
 * Vue d'ensemble Admin de toutes les Structures. "Subventions publiées"
 * compte les Subventions dont la campagne est déjà publiée (cf. domaine :
 * une campagne Programmée n'est pas encore utilisable). "Notes de frais en
 * attente" compte les Notes de frais que l'Admin doit encore traiter
 * (Soumise ou Prise en charge).
 */
function overviewInclude(now: Date) {
  return {
    financialMovements: {
      where: { accountType: "CLUB_BALANCE" as const },
      select: soldeMovementSelect,
    },
    _count: {
      select: {
        subventions: {
          where: { campaign: { publicationDate: { not: null, lte: now } } },
        },
        expenseReports: {
          where: {
            status: {
              in: ["SUBMITTED", "TAKEN_OVER"] as ("SUBMITTED" | "TAKEN_OVER")[],
            },
          },
        },
      },
    },
  };
}

function toOverview(asso: {
  id: string;
  slug: string;
  name: string;
  type: AssoType | null;
  status: AssoStatus;
  financialMovements: Parameters<typeof computeSolde>[1];
  _count: { subventions: number; expenseReports: number };
}): AssoOverview {
  return {
    id: asso.id,
    slug: asso.slug,
    name: asso.name,
    type: asso.type,
    status: asso.status,
    solde: computeSolde(asso.type, asso.financialMovements),
    subventionsPubliees: asso._count.subventions,
    notesDeFraisEnAttente: asso._count.expenseReports,
  };
}

export async function listAssociations(): Promise<AssoOverview[]> {
  const assos = await prisma.asso.findMany({
    where: EXCLUDE_DEMO_ASSO,
    orderBy: { name: "asc" },
    include: overviewInclude(new Date()),
  });

  return assos.map(toOverview);
}

export type AssoDirectoryEntry = { id: string; slug: string; name: string };

/**
 * Liste légère de toutes les Structures (pas de calcul de Solde), utilisée
 * pour permettre à l'Admin d'accéder à la vue "app" de n'importe quelle
 * Structure même sans y avoir de rôle (cf. resolveStructureAccess).
 */
export async function listAssoDirectory(): Promise<AssoDirectoryEntry[]> {
  return prisma.asso.findMany({
    where: EXCLUDE_DEMO_ASSO,
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true },
  });
}

export async function getAssociationOverview(
  slug: string,
): Promise<AssoOverview | null> {
  const asso = await prisma.asso.findUnique({
    where: { slug },
    include: overviewInclude(new Date()),
  });

  return asso ? toOverview(asso) : null;
}

export type AssoDetail = AssoOverview & {
  members: AssoMemberWithLogin[];
  subventions: VisibleSubvention[];
  notesDeFrais: ExpenseReportOverviewForAsso[];
};

/**
 * Vue complète d'une Structure pour la page Admin détail d'Asso (onglets
 * Aperçu/Solde/Subventions/Notes de frais/Documents) — étend AssoOverview
 * (déjà utilisée pour la liste) avec les données propres à chaque onglet.
 * Séparée de getAssociationOverview pour ne pas alourdir listAssociations,
 * qui n'a besoin que du résumé. Enveloppée dans `cache()` : la page et son
 * generateMetadata la chargent dans un même rendu.
 */
export const getAssociationDetail = cache(async function (
  slug: string,
): Promise<AssoDetail | null> {
  const overview = await getAssociationOverview(slug);
  if (!overview) return null;

  const [members, subventions, notesDeFrais] = await Promise.all([
    listAssoMembersWithLogin(overview.id),
    listVisibleSubventionsForAdmin(overview.id),
    listExpenseReportsForAsso(overview.id),
  ]);

  return { ...overview, members, subventions, notesDeFrais };
});
