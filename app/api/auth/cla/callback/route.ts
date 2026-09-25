import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  ClaAuthError,
  syncUserFromCla,
  syncAllAssociationsFromCla,
  type ClaAuthPayload,
  validateClaTicket,
} from "@/lib/auth/cla";

export async function GET(request: NextRequest) {
  const ticket = request.nextUrl.searchParams.get("ticket");
  if (!ticket) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("Ticket CLA manquant.")}`,
        request.url,
      ),
    );
  }

  let user;
  let payload: ClaAuthPayload;
  try {
    payload = await validateClaTicket(ticket);
    user = await syncUserFromCla(payload);
  } catch (error) {
    console.error("[CLA] Échec de l'authentification :", error);
    const message =
      error instanceof ClaAuthError
        ? error.message
        : "Erreur interne lors de l'authentification.";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
    );
  }

  await prisma.userLog.create({
    data: { userId: user.id, connectedAt: new Date() },
  });

  const session = await getSession();
  session.user = user;
  await session.save();

  const catalog = payload.allAssociations;
  if (user.isAdmin && catalog !== undefined) {
    after(async () => {
      try {
        await syncAllAssociationsFromCla(catalog);
      } catch (error) {
        console.error("[CLA] Échec de la synchronisation complète :", error);
      }
    });
  }

  return NextResponse.redirect(
    new URL(user.isAdmin ? "/app/admin" : "/app", request.url),
  );
}
