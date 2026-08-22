import { NextRequest, NextResponse } from "next/server";
import { isDevAuthBypassEnabled } from "@/lib/auth/dev-config";
import { DEMO_ASSO_SLUG } from "@/lib/auth/demo-config";
import { getDemoSession, getSession } from "@/lib/session";

const PUBLIC_PATHS = ["/", "/login", "/mentions-legales"];
const DEMO_PATH_PREFIX = `/app/${DEMO_ASSO_SLUG}`;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // L'Asso démo tourne sur un cookie séparé (cf. lib/session.ts) : elle ne
  // passe jamais par le contrôle de session réelle ci-dessous, même pour un
  // Admin déjà connecté sans cookie démo.
  if (pathname === DEMO_PATH_PREFIX || pathname.startsWith(`${DEMO_PATH_PREFIX}/`)) {
    const demoSession = await getDemoSession();
    if (demoSession.user) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  const session = await getSession();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!session.user) {
    if (isPublic) {
      return NextResponse.next();
    }

    if (isDevAuthBypassEnabled()) {
      const devLoginUrl = new URL("/api/auth/dev-login", request.url);
      devLoginUrl.searchParams.set(
        "redirect",
        `${pathname}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(devLoginUrl);
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login") {
    return NextResponse.redirect(
      new URL(session.user.isAdmin ? "/app/admin" : "/app", request.url),
    );
  }

  if (pathname.startsWith("/app/admin") && !session.user.isAdmin) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icon0.svg|icon1.png|apple-icon.png|logo.png|web-app-manifest-192x192.png|web-app-manifest-512x512.png).*)",
  ],
};
