import { headers } from "next/headers";
import type { PrismaClient } from "@/app/generated/prisma/client";
import { extractAssoSlug } from "@/lib/analytics/routes";
import { DEMO_ASSO_SLUG } from "@/lib/auth/demo-config";
import { isDevAuthBypassEnabled } from "@/lib/auth/dev-config";
import { getSession } from "@/lib/session";
import type { MutationSummary } from "./summarize";

/** Chemin de la page d'origine d'une requête, d'après son en-tête Referer. */
export function sourcePath(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).pathname;
  } catch {
    return null;
  }
}

/**
 * Écrit une ligne de journal pour une écriture déjà faite (cf. lib/prisma.ts).
 * Appelé dans `after()`, donc dans la requête de la Server Action ou du Route
 * Handler : la session et la page d'origine y sont lisibles.
 *
 * Rien n'est écrit pour l'Asso démo (son cookie est distinct de la vraie
 * session, cf. lib/session.ts), sans session, ni sous le bypass de dev.
 */
export async function recordAudit(
  client: PrismaClient,
  summary: MutationSummary,
): Promise<void> {
  if (isDevAuthBypassEnabled()) return;

  const path = sourcePath((await headers()).get("referer"));
  if (path && extractAssoSlug(path) === DEMO_ASSO_SLUG) return;

  const user = (await getSession()).user;
  if (!user || user.isDemo) return;

  await client.auditLog.create({
    data: {
      actorId: user.id,
      actorIsAdmin: user.isAdmin,
      fromAdminSpace: path?.startsWith("/app/admin") ?? false,
      model: summary.model,
      operation: summary.operation,
      action: summary.action,
      entityId: summary.entityId,
      assoId: summary.assoId,
      path,
      details: summary.details ?? undefined,
    },
  });
}
