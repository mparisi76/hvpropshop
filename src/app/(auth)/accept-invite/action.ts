"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { acceptUserInvite } from "@directus/sdk";
import directus from "@/lib/directus";
import { REFRESH_COOKIE, jwtPayload, loginWithPassword, logoutSession, setSessionCookies } from "@/lib/session";

/** `redirectTo` is set on success: the page does a full load so nothing from a previous session lingers. */
export type AcceptState = { error?: string; redirectTo?: string } | null;

const MIN_PASSWORD = 8;

export async function acceptInvite(_prev: AcceptState, formData: FormData): Promise<AcceptState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return { error: "This invite link is missing its code. Use the link from your email." };
  if (password.length < MIN_PASSWORD) return { error: `Use at least ${MIN_PASSWORD} characters.` };
  if (password !== confirm) return { error: "The passwords don't match." };

  try {
    await directus.request(acceptUserInvite(token, password));
  } catch (error) {
    console.error("Accept invite error:", error);
    return { error: "This invite link has expired or was already used. Ask HV Prop Shop for a new one." };
  }

  // Sign them straight in, replacing any session already in this browser
  // (e.g. an admin testing the invite) so the dashboard shows the new vendor
  const email = jwtPayload(token)?.email;
  const tokens = typeof email === "string" ? await loginWithPassword(email, password) : null;
  if (!tokens) redirect("/login?next=/dashboard/profile");

  const store = await cookies();
  const previous = store.get(REFRESH_COOKIE)?.value;
  if (previous) await logoutSession(previous);
  setSessionCookies(store, tokens);
  return { redirectTo: "/dashboard/profile?welcome=1" };
}
