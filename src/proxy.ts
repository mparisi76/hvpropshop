import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_EARLY_MS,
  cookieOptions,
  refreshSession,
  tokenExpiry,
  type SessionTokens,
} from "@/lib/session";

/**
 * Keeps vendor sessions alive ("stay logged in").
 *
 * - Any page load or save: if the Directus access token is missing or about
 *   to expire, swap the refresh token for new tokens and pass them on.
 * - /login: if the vendor already has a working session, skip straight to
 *   the dashboard.
 */

// Directus rotates refresh tokens, so two requests refreshing with the same
// token at once would make one fail. Share one in-flight refresh per token.
const inFlight = new Map<string, Promise<SessionTokens | null>>();

function refreshOnce(refreshToken: string) {
  let pending = inFlight.get(refreshToken);
  if (!pending) {
    pending = refreshSession(refreshToken).finally(() => {
      // Keep briefly so near-simultaneous requests reuse the result
      setTimeout(() => inFlight.delete(refreshToken), 10_000);
    });
    inFlight.set(refreshToken, pending);
  }
  return pending;
}

function withTokens(response: NextResponse, tokens: SessionTokens) {
  response.cookies.set(ACCESS_COOKIE, tokens.access_token, cookieOptions);
  response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, cookieOptions);
  return response;
}

/** A same-site path to return to after login, or null if missing/unsafe. */
function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return null;
  return value;
}

/** /login?next=<where they were going> */
function toLogin(request: NextRequest) {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

function clearSession(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";
  // Only page loads get bounced to login (not form saves, which can't follow a redirect)
  const isDashboardPage =
    (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) && request.method === "GET";

  const accessValid = Boolean(access) && tokenExpiry(access) - Date.now() > REFRESH_EARLY_MS;

  // Already logged in → skip the login page and go where they were headed
  if (isLogin) {
    const destination = new URL(safeNext(request.nextUrl.searchParams.get("next")) ?? "/dashboard", request.url);
    if (accessValid) return NextResponse.redirect(destination);
    if (refresh) {
      const tokens = await refreshOnce(refresh);
      if (tokens) return withTokens(NextResponse.redirect(destination), tokens);
    }
    return NextResponse.next();
  }

  if (accessValid) return NextResponse.next();
  if (!refresh) return isDashboardPage ? toLogin(request) : NextResponse.next();

  const tokens = await refreshOnce(refresh);
  if (!tokens) {
    console.warn(`[session] proxy could not renew session for ${pathname}`);
    // If the current access token still works, carry on.
    if (access && tokenExpiry(access) > Date.now()) return NextResponse.next();
    // Otherwise the session is over: clear the cookies so we don't retry on every page.
    if (isDashboardPage) return clearSession(toLogin(request));
    request.cookies.delete(ACCESS_COOKIE);
    request.cookies.delete(REFRESH_COOKIE);
    return clearSession(NextResponse.next({ request: { headers: request.headers } }));
  }

  // Make the new tokens visible to this request's server components/actions…
  request.cookies.set(ACCESS_COOKIE, tokens.access_token);
  request.cookies.set(REFRESH_COOKIE, tokens.refresh_token);
  // …and store them in the browser for next time.
  return withTokens(NextResponse.next({ request: { headers: request.headers } }), tokens);
}

export const config = {
  // Every page (so the header can show the logged-in vendor), but not API
  // routes, Next.js internals or static files.
  matcher: ["/((?!api/|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
