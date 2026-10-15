import { PrismaPg } from "@prisma/adapter-pg";
import { after } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import {
  isAuditedMutation,
  summarizeMutation,
  type MutationSummary,
} from "@/lib/audit/summarize";

const globalForPrisma = globalThis as unknown as {
  unauditedPrisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

/**
 * Client sans journal d'audit : réservé aux écritures qui ne sont pas des
 * actions d'un utilisateur (fixtures démo, maintenance des analytics, écriture
 * du journal lui-même). Tout le reste passe par `prisma`.
 */
export const unauditedPrisma =
  globalForPrisma.unauditedPrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.unauditedPrisma = unauditedPrisma;
}

/**
 * Point unique de l'audit : chaque écriture métier réussie (cf.
 * AUDITED_MODELS) est journalisée après la réponse, avec l'auteur lu dans la
 * session. Aucune Server Action n'a donc à y penser, y compris les futures.
 */
export const prisma = unauditedPrisma.$extends({
  name: "audit",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const result = await query(args);
        if (isAuditedMutation(model, operation)) {
          scheduleAudit(summarizeMutation({ model, operation, args, result }));
        }
        return result;
      },
    },
  },
});

/** Client reçu dans `prisma.$transaction(async (tx) => …)`. */
export type PrismaTransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

function scheduleAudit(summary: MutationSummary) {
  try {
    after(async () => {
      try {
        // Import différé : lib/audit/record lit la session, qui exige
        // SESSION_SECRET — inutile aux scripts qui importent ce module.
        const { recordAudit } = await import("@/lib/audit/record");
        await recordAudit(unauditedPrisma, summary);
      } catch (error) {
        console.error("[audit] Échec de l'enregistrement :", error);
      }
    });
  } catch {
    // Hors requête (seed, script) : aucun utilisateur à qui l'attribuer.
  }
}
