import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_EARLY_MS,
  refreshSession,
  setSessionCookies,
  tokenExpiry,
} from "@/lib/session";

/**
 * Access token for use inside a server action.
 *
 * src/proxy.ts normally renews tokens before the action runs. As a safety net,
 * if the token is still missing or about to expire here, renew it now and save
 * the new cookies (server actions are allowed to set cookies).
 */
export async function getActionToken(): Promise<string> {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  if (access && tokenExpiry(access) - Date.now() > REFRESH_EARLY_MS) return access;

  const refresh = store.get(REFRESH_COOKIE)?.value;
  if (refresh) {
    const tokens = await refreshSession(refresh);
    if (tokens) {
      console.info("[session] Renewed in server action (proxy didn't renew first)");
      setSessionCookies(store, tokens);
      return tokens.access_token;
    }
  }

  // Couldn't renew — use what we have if it hasn't expired yet, else log in again
  if (access && tokenExpiry(access) > Date.now()) return access;
  redirect("/login");
}
