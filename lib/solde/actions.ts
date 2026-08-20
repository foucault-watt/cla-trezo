"use server";

import { requireAdmin, requireStructureAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { computeSolde, type SoldeView } from "./solde";

async function getSoldeForAsso(assoId: string): Promise<SoldeView> {
  const asso = await prisma.asso.findUniqueOrThrow({
    where: { id: assoId },
    select: { type: true },
  });

  const movements = await prisma.financialMovement.findMany({
    where: { assoId, accountType: "CLUB_BALANCE" },
    select: {
      id: true,
      movementType: true,
      amountCents: true,
      origin: true,
      category: true,
      description: true,
      createdAt: true,
    },
  });

  return computeSolde(asso.type, movements);
}

export async function getClubSolde(assoSlug: string): Promise<SoldeView> {
  const { structure } = await requireStructureAccess(assoSlug);
  return getSoldeForAsso(structure.assoId);
}

/**
 * Même vue que getClubSolde, pour l'Admin qui édite une Note de frais Prise
 * en charge (#18) : celui-ci n'est rattaché à aucune Structure, donc scopé
 * directement par assoId (déduit de la Note) plutôt que par assoSlug.
 */
export async function getClubSoldeForAdmin(assoId: string): Promise<SoldeView> {
  await requireAdmin();
  return getSoldeForAsso(assoId);
}
