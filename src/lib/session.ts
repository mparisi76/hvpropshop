/**
 * Vendor session cookies.
 *
 * Directus access tokens are short-lived (~15 min by default). We keep the
 * refresh token too, and src/proxy.ts swaps it for a fresh access token
 * shortly before the current one expires, so vendors stay logged in.
 */

export const ACCESS_COOKIE = "directus_token";
export const REFRESH_COOKIE = "directus_refresh";

/** Refresh when the access token has less than this left. */
export const REFRESH_EARLY_MS = 3 * 60 * 1000;

/**
 * Rolling "stay logged in" session: every refresh issues a new refresh token
 * and resets this clock, so vendors who visit at least this often never have
 * to log in again. 400 days is the longest browsers keep a cookie.
 * Must match REFRESH_TOKEN_TTL in the Directus server config ("400d").
 */
const SESSION_MAX_AGE = 60 * 60 * 24 * 400;

export interface SessionTokens {
  access_token: string;
  refresh_token: string;
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

/** Anything with a Next.js-style cookies().set() */
interface CookieSetter {
  set(name: string, value: string, options: typeof cookieOptions): unknown;
}

export function setSessionCookies(cookies: CookieSetter, tokens: SessionTokens) {
  cookies.set(ACCESS_COOKIE, tokens.access_token, cookieOptions);
  cookies.set(REFRESH_COOKIE, tokens.refresh_token, cookieOptions);
}

/** Expiry time (ms since epoch) from a JWT, or 0 if unreadable. */
export function tokenExpiry(token: string | undefined): number {
  if (!token) return 0;
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/**
 * Log in with email + password. Calls Directus directly (not the shared SDK
 * client) so tokens are never stored in server memory shared between users.
 */
export async function loginWithPassword(email: string, password: string): Promise<SessionTokens | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, mode: "json" }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    if (!data?.access_token || !data?.refresh_token) return null;
    return { access_token: data.access_token, refresh_token: data.refresh_token };
  } catch (error) {
    console.error("Login request failed:", error);
    return null;
  }
}

/** True if a Directus error means the session token is no longer usable. */
export function isSessionError(error: unknown) {
  const code = (error as { errors?: { extensions?: { code?: string } }[] })?.errors?.[0]?.extensions?.code;
  return code === "TOKEN_EXPIRED" || code === "INVALID_TOKEN" || code === "INVALID_CREDENTIALS";
}

/** Check a password without creating a lasting session. */
export async function verifyPassword(email: string, password: string) {
  const tokens = await loginWithPassword(email, password);
  if (!tokens) return false;
  await logoutSession(tokens.refresh_token);
  return true;
}

/** Revoke a refresh token (best effort). */
export async function logoutSession(refreshToken: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
      cache: "no-store",
    });
  } catch {
    // ignore — cookies are cleared regardless
  }
}

/** Exchange a refresh token for new tokens. Returns null if Directus rejects it. */
export async function refreshSession(refreshToken: string): Promise<SessionTokens | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[session] Refresh rejected by Directus (${res.status}):`, await res.text());
      return null;
    }
    const { data } = await res.json();
    if (!data?.access_token || !data?.refresh_token) return null;
    return { access_token: data.access_token, refresh_token: data.refresh_token };
  } catch (error) {
    console.error("[session] Refresh request failed:", error);
    return null;
  }
}
