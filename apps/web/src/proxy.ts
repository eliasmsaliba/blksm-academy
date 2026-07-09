import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

/**
 * Optimistic-only check: presence of the access_token cookie, not verification.
 * Real authorization always happens server-side via the API's 401/403 responses.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("access_token");
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Exclude API routes, Next.js internals, and any static file in public/
  // (images, icons, etc.) — those must never get redirected to /login,
  // otherwise next/image (and direct <img>/<link> requests) receive an
  // HTML redirect instead of the actual asset.
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[\\w]+$).*)"],
};
