import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_EXACT = new Set(["/", "/login", "/register", "/api/health"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("bsp_session")?.value;
  const isPublic =
    PUBLIC_EXACT.has(pathname) ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/tinymce/") ||
    pathname.startsWith("/api/health");

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|uploads/).*)"],
};
