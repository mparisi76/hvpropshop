import { cache } from "react";
import { unstable_cache, updateTag } from "next/cache";
import { readItems } from "@directus/sdk";
import directus from "@/lib/directus";
import { Category, CategoryTree, Prop } from "@/types";
import { getCategoryTree } from "@/lib/utils";
import { formatLocation, locationSlug } from "@/lib/browse";

export interface CatalogLocation {
  label: string; // "Kingston, NY"
  slug: string; // "kingston-ny"
  itemCount: number;
  vendorIds: string[];
}

/** Cache tag for the catalog and vendor list; cleared whenever listings or vendors change. */
export const CATALOG_TAG = "catalog";

/**
 * Clear the cached catalog after a change (call from server actions only).
 * Changes made directly in Directus show up within CATALOG_TTL instead.
 */
export function refreshCatalog() {
  updateTag(CATALOG_TAG);
}

/** Seconds before cached catalog data is rebuilt even without a change. */
export const CATALOG_TTL = 300;

/**
 * Categories, per-category counts and pickup towns for all published items.
 * Built from every published item, so it's cached across requests (shared by
 * pages, their metadata and "Load more") rather than rebuilt on every visit.
 */
const loadCatalog = unstable_cache(
  async () => {
  const [categories, allItems] = await Promise.all([
    directus.request<Category[]>(
      readItems("categories", { fields: ["id", "name", "slug", { parent: ["id", "slug"] }], limit: -1 })
    ),
    directus.request<Prop[]>(
      readItems("props", {
        fields: ["id", { category: ["id", "slug", { parent: ["id", "slug"] }] }, { user_created: ["id", "city", "state"] }],
        filter: { status: { _eq: "published" } },
        limit: -1,
      })
    ),
  ]);

  const tree = getCategoryTree(categories, allItems);
  const vendorCount = new Set(allItems.map((i) => i.user_created?.id).filter(Boolean)).size;

  const byLocation = new Map<string, CatalogLocation>();
  for (const item of allItems) {
    const label = formatLocation(item.user_created?.city, item.user_created?.state);
    if (!label) continue;
    const loc = byLocation.get(label) ?? { label, slug: locationSlug(label), itemCount: 0, vendorIds: [] };
    loc.itemCount++;
    const vendorId = item.user_created?.id;
    if (vendorId && !loc.vendorIds.includes(vendorId)) loc.vendorIds.push(vendorId);
    byLocation.set(label, loc);
  }
  const locations = [...byLocation.values()].sort((a, b) => a.label.localeCompare(b.label));

  return { tree, itemCount: allItems.length, vendorCount, locations };
  },
  ["catalog-v1"],
  { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] }
);

export const getCatalog = cache(() => loadCatalog());

/** A category (parent or child) by slug, with its parent for breadcrumbs. */
export function findCategory(tree: CategoryTree, slug: string | undefined) {
  if (!slug) return null;
  for (const [parentId, parent] of Object.entries(tree)) {
    if (parent.slug === slug) {
      return {
        current: { name: parent.name, slug: parent.slug, count: parent.totalCount },
        parent: undefined,
        ids: [parentId, ...Object.keys(parent.children)],
      };
    }
    const childEntry = Object.entries(parent.children).find(([, c]) => c.slug === slug);
    if (childEntry) {
      const [childId, child] = childEntry;
      return {
        current: { name: child.name, slug: child.slug, count: child.count },
        parent: { name: parent.name, slug: parent.slug },
        ids: [childId],
      };
    }
  }
  return null;
}

/** Category IDs for a slug (the category plus its subcategories), or null if unknown. */
export async function categoryIdsForSlug(slug: string | null | undefined) {
  if (!slug) return null;
  return findCategory((await getCatalog()).tree, slug)?.ids ?? null;
}
