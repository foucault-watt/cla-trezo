import { NextRequest, NextResponse } from "next/server";
import {
  isDevAuthBypassEnabled,
  normalizeDevAuthRedirect,
} from "@/lib/auth/dev-config";
import { getDevSessionUser } from "@/lib/auth/dev";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  if (!isDevAuthBypassEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const session = await getSession();
    session.user = await getDevSessionUser();
    await session.save();

    const destination = normalizeDevAuthRedirect(
      request.nextUrl.searchParams.get("redirect"),
    );
    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    console.error("[DEV AUTH] Échec de la création de session :", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de créer la session de développement.",
      },
      { status: 500 },
    );
  }
}
