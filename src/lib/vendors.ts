import { unstable_cache } from "next/cache";
import { readItems, readUser, readUsers } from "@directus/sdk";
import { CATALOG_TAG, CATALOG_TTL } from "@/lib/catalog";
import { getDropdownField, withOptionalField, type DropdownField, type FieldChoice } from "@/lib/fields";
import directus from "@/lib/directus";
import { Vendor } from "@/types";

/** directus_users fields that are safe to show publicly (shop_logo is added when readable). */
const VENDOR_BASE_FIELDS = [
  "id",
  "first_name",
  "last_name",
  "shop_name",
  "city",
  "state",
  "website",
  "featured_vendor",
  "inventory_type",
] as const;

export const VENDOR_PUBLIC_FIELDS = [...VENDOR_BASE_FIELDS, "shop_logo"] as const;

/** Lighter field set for cards and item lists. */
export const VENDOR_CARD_FIELDS = ["id", "shop_name", "first_name", "city", "state"] as const;

export function vendorName(v?: Vendor | null) {
  if (!v) return "Independent vendor";
  return (
    v.shop_name ||
    [v.first_name, v.last_name].filter(Boolean).join(" ") ||
    "Independent vendor"
  );
}

export function vendorLocation(v?: Vendor | null) {
  return [v?.city, v?.state].filter(Boolean).join(", ");
}

export type InventoryChoice = FieldChoice;
export type InventoryTypeField = DropdownField;

/** The inventory_type dropdown's choices (see getDropdownField). */
export function getInventoryTypeField(token?: string) {
  return getDropdownField("directus_users", "inventory_type", token);
}

/** "mid_century-furniture" → "Mid century furniture" (used when choice labels aren't available) */
const prettify = (v: string) => {
  const s = v.replace(/[_-]+/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function formatInventoryType(
  value: Vendor["inventory_type"],
  choices: InventoryChoice[] = []
) {
  if (!value) return "";
  const values = (Array.isArray(value) ? value : [value]).filter(Boolean).map(String);
  return values
    .map((v) => choices.find((c) => c.value === v)?.text ?? prettify(v))
    .join(", ");
}

/** Returns a safe, absolute http(s) URL plus a short display label, or null. */
export function vendorWebsite(url?: string | null) {
  if (!url) return null;
  const trimmed = url.trim();
  try {
    const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const label = (parsed.hostname + parsed.pathname).replace(/^www\./, "").replace(/\/$/, "");
    return { href: parsed.toString(), label };
  } catch {
    return null;
  }
}

/** Published item counts keyed by vendor (user) id. */
export async function getVendorItemCounts(): Promise<Map<string, number>> {
  const rows = (await directus.request(
    readItems("props", {
      aggregate: { count: "*" },
      groupBy: ["user_created"],
      filter: { status: { _eq: "published" } },
      limit: -1,
    })
  )) as unknown as { user_created: string | null; count: string | number }[];

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.user_created) counts.set(String(row.user_created), Number(row.count) || 0);
  }
  return counts;
}

/** All vendors with at least one published item, featured first then A–Z. */
export async function getVendors() {
  const counts = await getVendorItemCounts();
  const ids = [...counts.keys()];
  if (ids.length === 0) return [];

  const load = (fields: readonly string[]) =>
    directus.request(readUsers({ fields: [...fields], filter: { id: { _in: ids } }, limit: -1 }));
  const users = (await withOptionalField(
    "shop_logo",
    () => load(VENDOR_PUBLIC_FIELDS),
    () => load(VENDOR_BASE_FIELDS)
  )) as unknown as Vendor[];

  return users
    .map((v) => ({ ...v, itemCount: counts.get(String(v.id)) ?? 0 }))
    .sort(
      (a, b) =>
        Number(!!b.featured_vendor) - Number(!!a.featured_vendor) ||
        vendorName(a).localeCompare(vendorName(b))
    );
}

/** A single vendor, or null if they don't exist / have nothing published. */
export async function getVendor(id: string) {
  try {
    const [countRow] = (await directus.request(
      readItems("props", {
        aggregate: { count: "*" },
        filter: { _and: [{ status: { _eq: "published" } }, { user_created: { _eq: id } }] },
      })
    )) as unknown as { count: string | number }[];
    const itemCount = Number(countRow?.count) || 0;
    if (itemCount === 0) return null;

    const load = (fields: readonly string[]) => directus.request(readUser(id, { fields: [...fields] }));
    const vendor = (await withOptionalField(
      "shop_logo",
      () => load(VENDOR_PUBLIC_FIELDS),
      () => load(VENDOR_BASE_FIELDS)
    )) as unknown as Vendor;
    return vendor ? { ...vendor, itemCount } : null;
  } catch {
    return null;
  }
}

/** getVendors, cached across requests and cleared with the catalog. */
export const getVendorsCached = unstable_cache(() => getVendors(), ["vendors-v1"], {
  revalidate: CATALOG_TTL,
  tags: [CATALOG_TAG],
});
