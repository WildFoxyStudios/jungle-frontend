import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Route classification ─────────────────────────────────────────────────────

/** These paths are accessible without a session token */
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/",
];

/** These paths should redirect to /home when the user is already authenticated */
const AUTH_ONLY_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

// Static asset / Next.js internals – skip middleware entirely
const SKIP_PREFIXES = [
  "/_next/",
  "/favicon.ico",
  "/public/",
  "/api/", // Backend proxy path (if any)
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function isAuthOnly(pathname: string): boolean {
  return AUTH_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function shouldSkip(pathname: string): boolean {
  return SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Extract the session token from either:
 *   1. The `session_token` cookie (set by the app after login)
 *   2. The `Authorization: Bearer …` request header (for programmatic clients)
 */
function getToken(request: NextRequest): string | null {
  // 1. Cookie (primary – works for browser navigation)
  const cookieToken = request.cookies.get("session_token")?.value;
  if (cookieToken) return cookieToken;

  // 2. Authorization header (secondary – useful during SSR data-fetching)
  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim() || null;
  }

  return null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Skip static files, Next.js internals, etc.
  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  const token = getToken(request);
  const isAuthenticated = Boolean(token);

  // ── Authenticated user trying to visit a login/register page ────────────
  if (isAuthenticated && isAuthOnly(pathname)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/home";
    return NextResponse.redirect(homeUrl);
  }

  // ── Unauthenticated user trying to visit a protected page ───────────────
  if (!isAuthenticated && !isPublic(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // Preserve the original destination so we can redirect back after login
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── All good – pass through ───────────────────────────────────────────────
  return NextResponse.next();
}

// ─── Matcher ─────────────────────────────────────────────────────────────────
// Apply this middleware to every route except static assets and API routes.

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (static files)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     *   - Files with an extension (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)",
  ],
};
