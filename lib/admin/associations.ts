import type { AssoStatus, AssoType } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { computeSolde, type SoldeView } from "@/lib/solde/solde";

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
      select: {
        id: true,
        movementType: true,
        amountCents: true,
        origin: true,
        category: true,
        description: true,
        createdAt: true,
      },
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
    orderBy: { name: "asc" },
    include: overviewInclude(new Date()),
  });

  return assos.map(toOverview);
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
