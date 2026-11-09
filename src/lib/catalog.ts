import { cache } from "react";
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

/**
 * Categories, per-category counts and pickup towns for all published items.
 * Cached per request so pages and their metadata share one fetch.
 */
export const getCatalog = cache(async () => {
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
});

/** A category (parent or child) by slug, with its parent for breadcrumbs. */
export function findCategory(tree: CategoryTree, slug: string | undefined) {
  if (!slug) return null;
  for (const parent of Object.values(tree)) {
    if (parent.slug === slug) {
      return { current: { name: parent.name, slug: parent.slug, count: parent.totalCount }, parent: undefined };
    }
    const child = Object.values(parent.children).find((c) => c.slug === slug);
    if (child) {
      return {
        current: { name: child.name, slug: child.slug, count: child.count },
        parent: { name: parent.name, slug: parent.slug },
      };
    }
  }
  return null;
}
