import { after, NextRequest, NextResponse, userAgent } from "next/server";
import { maybeRunAnalyticsMaintenance } from "@/lib/analytics/maintenance";
import {
  cleanPath,
  deviceKind,
  extractAssoSlug,
  isTrackablePath,
  normalizeRoute,
} from "@/lib/analytics/routes";
import { isDevAuthBypassEnabled } from "@/lib/auth/dev-config";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Reçoit une page vue envoyée par <PageViewTracker /> (sendBeacon). Répond
 * toujours 204 : le client n'a rien à faire du résultat, et un refus ne doit
 * rien apprendre à qui sonde la route.
 */
export async function POST(request: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  if (isDevAuthBypassEnabled()) return done;

  const agent = userAgent(request);
  if (agent.isBot) return done;

  const body: unknown = await request.json().catch(() => null);
  const rawPath =
    typeof body === "object" && body !== null && "path" in body
      ? body.path
      : null;
  if (typeof rawPath !== "string" || !isTrackablePath(rawPath)) return done;

  const user = (await getSession()).user;
  if (!user || user.isDemo) return done;

  const path = cleanPath(rawPath);
  const device = deviceKind(agent.device.type);

  after(async () => {
    try {
      const slug = extractAssoSlug(path);
      const asso = slug
        ? await prisma.asso.findUnique({ where: { slug }, select: { id: true } })
        : null;
      await prisma.pageView.create({
        data: {
          userId: user.id,
          assoId: asso?.id ?? null,
          path,
          route: normalizeRoute(path),
          device,
          isAdmin: user.isAdmin,
        },
      });
    } catch (error) {
      console.error("[analytics] Échec de l'enregistrement :", error);
    }
    await maybeRunAnalyticsMaintenance();
  });

  return done;
}
