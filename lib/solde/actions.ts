"use server";

import { requireStructureAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { computeSolde, type SoldeView } from "./solde";

export async function getClubSolde(assoSlug: string): Promise<SoldeView> {
  const { structure } = await requireStructureAccess(assoSlug);

  const asso = await prisma.asso.findUniqueOrThrow({
    where: { id: structure.assoId },
    select: { type: true },
  });

  const movements = await prisma.financialMovement.findMany({
    where: { assoId: structure.assoId, accountType: "CLUB_BALANCE" },
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
