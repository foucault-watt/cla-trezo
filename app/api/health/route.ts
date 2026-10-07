import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Healthcheck appelé par Coolify (depuis l'intérieur du conteneur) pour savoir
// si l'app est prête : répond 200 si le serveur tourne et que la base répond,
// 503 sinon. Publique (cf. proxy.ts) et sans aucune donnée sensible.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[HEALTH] Base de données injoignable :", error);
    return NextResponse.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
