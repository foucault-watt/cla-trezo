import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const PUBLIC_PATHS = ["/", "/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = await getSession();
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!session.user) {
    if (isPublic) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login") {
    return NextResponse.redirect(
      new URL(session.user.isAdmin ? "/admin" : "/dashboard", request.url),
    );
  }

  if (pathname.startsWith("/admin") && !session.user.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
