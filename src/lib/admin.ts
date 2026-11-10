import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { readItems, readRoles, readUsers, withToken, type RestCommand } from "@directus/sdk";
import directus from "@/lib/directus";
import { asServer } from "@/lib/serverDirectus";
import { getCurrentUser, isAdmin } from "@/lib/currentUser";
import { ACCESS_COOKIE } from "@/lib/session";
import { BOOKING_STATUS, findBookings } from "@/lib/bookings";
import { getVendorItemCounts } from "@/lib/vendors";

/** Directus role new vendors get (VENDOR_ROLE_NAME, default "Vendor"). */
export const VENDOR_ROLE_NAME = process.env.VENDOR_ROLE_NAME || "Vendor";

/** For admin pages: the admin user, or 404 for everyone else. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdmin(user)) notFound();
  return user;
}

/** Run a Directus request with the logged-in admin's own token. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function asAdmin<T>(command: RestCommand<any, any>, token?: string): Promise<T> {
  const t = token ?? (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!t) redirect("/login?next=/admin");
  return (await directus.request(withToken(t, command))) as T;
}

/* ---------- Bookings ---------- */

export function getAllBookings() {
  return findBookings({ status: { _in: Object.values(BOOKING_STATUS) } }, 1000);
}

export interface PayoutQueueRow {
  id: string | number;
  end_date: string;
  payout_amount: number | null;
  prop_id: { name: string; user_created: { id: string; shop_name: string | null; first_name: string | null } | null } | null;
}

export async function getPendingPayouts() {
  try {
    return (await asServer(
      readItems("rentals", {
        fields: [
          "id",
          "end_date",
          "payout_amount",
          { prop_id: ["name", { user_created: ["id", "shop_name", "first_name"] }] },
        ],
        filter: { _and: [{ kind: { _eq: "booking" } }, { payout_status: { _eq: "pending" } }] },
        sort: ["end_date"],
        limit: 500,
      })
    )) as unknown as PayoutQueueRow[];
  } catch {
    return [];
  }
}

/* ---------- Vendors ---------- */

export interface AdminVendor {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  shop_name: string | null;
  city: string | null;
  state: string | null;
  featured_vendor: boolean | null;
  stripe_account_id: string | null;
  status: string | null;
  last_access: string | null;
  itemCount: number;
}

export async function getAdminVendors(): Promise<AdminVendor[]> {
  const [users, counts] = await Promise.all([
    asAdmin<Omit<AdminVendor, "itemCount">[]>(
      readUsers({
        fields: [
          "id", "email", "first_name", "last_name", "shop_name", "city", "state",
          "featured_vendor", "stripe_account_id", "status", "last_access",
        ],
        filter: { role: { name: { _eq: VENDOR_ROLE_NAME } } },
        sort: ["shop_name"],
        limit: -1,
      })
    ),
    getVendorItemCounts().catch(() => new Map<string, number>()),
  ]);
  return users.map((u) => ({ ...u, itemCount: counts.get(String(u.id)) ?? 0 }));
}

export async function getVendorRoleId(token?: string) {
  if (process.env.VENDOR_ROLE_ID) return process.env.VENDOR_ROLE_ID;
  const [role] = await asAdmin<{ id: string }[]>(
    readRoles({ fields: ["id"], filter: { name: { _eq: VENDOR_ROLE_NAME } }, limit: 1 }),
    token
  );
  if (!role) throw new Error(`No Directus role named "${VENDOR_ROLE_NAME}" — set VENDOR_ROLE_NAME or VENDOR_ROLE_ID`);
  return role.id;
}

/* ---------- Applications ---------- */

export interface VendorApplication {
  id: string | number;
  status: string;
  name: string;
  email: string;
  phone: string | null;
  shop_name: string;
  city: string | null;
  state: string | null;
  /** "What do you rent?" — copied to directus_users.inventory on approval */
  inventory: string | null;
  item_count: string | null;
  website: string | null;
  message: string | null;
  date_created: string | null;
}

export async function getApplications() {
  try {
    return await asAdmin<VendorApplication[]>(
      readItems("vendor_applications", { fields: ["*"], sort: ["-date_created"], limit: 500 })
    );
  } catch (error) {
    console.warn('[admin] Couldn\'t load vendor_applications (does the collection exist?):', error);
    return null;
  }
}
