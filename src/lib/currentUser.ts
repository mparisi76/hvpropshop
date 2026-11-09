import { cache } from "react";
import { cookies } from "next/headers";
import { readMe, withToken } from "@directus/sdk";
import directus from "@/lib/directus";
import { ACCESS_COOKIE, tokenExpiry } from "@/lib/session";

export interface CurrentUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  shop_name: string | null;
  avatar: string | null;
  role: { name: string | null } | string | null;
}

/**
 * The logged-in vendor, or null. Cached for the duration of a request, so
 * layouts and pages can all call it without extra Directus round-trips.
 * (src/proxy.ts renews the session before the page renders.)
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token || tokenExpiry(token) <= Date.now()) return null;
  try {
    const me = await directus.request(
      withToken(
        token,
        readMe({
          fields: ["id", "email", "first_name", "last_name", "shop_name", "avatar", { role: ["name"] }],
        })
      )
    );
    return (me as unknown as CurrentUser) ?? null;
  } catch {
    return null;
  }
});

/** "Jane Doe" → "JD"; falls back to shop name, then email. */
export function userInitials(u: Pick<CurrentUser, "first_name" | "last_name" | "shop_name" | "email">) {
  const fromName = [u.first_name, u.last_name]
    .map((s) => s?.trim()?.[0])
    .filter(Boolean)
    .join("");
  if (fromName) return fromName.toUpperCase();
  const shop = u.shop_name?.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("");
  if (shop) return shop.toUpperCase();
  return (u.email?.[0] ?? "?").toUpperCase();
}

export function userDisplayName(u: Pick<CurrentUser, "first_name" | "last_name" | "shop_name" | "email">) {
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || u.shop_name || u.email || "Account";
}

/** Role name, e.g. "Vendor". Falls back to "Vendor" if the role isn't readable. */
export function userRoleName(u: CurrentUser) {
  return (typeof u.role === "object" && u.role?.name) || "Vendor";
}

/**
 * Admins are users whose Directus role is listed in ADMIN_ROLE_NAMES
 * (comma-separated; defaults to Directus's built-in "Administrator").
 */
export function isAdmin(u: CurrentUser | null) {
  if (!u) return false;
  const role = typeof u.role === "object" ? u.role?.name : null;
  const admins = (process.env.ADMIN_ROLE_NAMES || "Administrator").split(",").map((r) => r.trim().toLowerCase());
  return Boolean(role && admins.includes(role.toLowerCase()));
}

/** Props for the <AccountMenu> client component. */
export function toMenuUser(u: CurrentUser) {
  return {
    name: userDisplayName(u),
    role: userRoleName(u),
    isAdmin: isAdmin(u),
    email: u.email,
    initials: userInitials(u),
    avatarUrl: u.avatar
      ? `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${u.avatar}?width=128&height=128&fit=cover&format=webp`
      : null,
  };
}
