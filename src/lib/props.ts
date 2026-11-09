import { readItems } from "@directus/sdk";
import directus from "@/lib/directus";
import { Prop } from "@/types";
import { parseLocation, resolveSort } from "@/lib/browse";
import { unstable_cache } from "next/cache";
import { CATALOG_TAG, CATALOG_TTL, categoryIdsForSlug } from "@/lib/catalog";

export const PAGE_SIZE = 12;

/** Fields needed to render a PropCard. */
export const CARD_FIELDS = [
  "id",
  "name",
  "price",
  "thumbnail",
  "availability",
  { category: ["id", "name", "slug", { parent: ["id", "name", "slug"] }] },
  { user_created: ["id", "shop_name", "first_name", "city", "state"] },
] as const;

/* ---------- Filters ---------- */

export interface PropQuery {
  category?: string | null;
  search?: string | null;
  vendor?: string | null;
  /** "City, ST" — matches the vendor's pickup location */
  loc?: string | null;
  /** Category + subcategory IDs (resolved from `category`); preferred over slug matching */
  categoryIds?: string[] | null;
}

/** Directus filter for published props matching the query. */
export function buildPropFilter({ category, categoryIds, search, vendor, loc }: PropQuery) {
  const and: Record<string, unknown>[] = [{ status: { _eq: "published" } }];

  if (categoryIds?.length) {
    and.push({ category: { id: { _in: categoryIds } } });
  } else if (category) {
    and.push({
      _or: [
        { category: { slug: { _eq: category } } },
        { category: { parent: { slug: { _eq: category } } } },
      ],
    });
  }

  if (search) {
    and.push({
      _or: [
        { name: { _icontains: search } },
        { description: { _icontains: search } },
      ],
    });
  }

  if (vendor) {
    and.push({ user_created: { _eq: vendor } });
  }

  if (loc) {
    const { city, state } = parseLocation(loc);
    and.push({
      user_created: {
        city: { _eq: city },
        ...(state ? { state: { _eq: state } } : {}),
      },
    });
  }

  return { _and: and };
}

/** A page of props for the feed. */
export async function getPropsPage(query: PropQuery & { sort?: string | null; offset?: number }) {
  const categoryIds = query.categoryIds ?? (await categoryIdsForSlug(query.category));
  return directus.request<Prop[]>(
    readItems("props", {
      fields: [...CARD_FIELDS],
      filter: buildPropFilter({ ...query, categoryIds }),
      limit: PAGE_SIZE,
      offset: query.offset ?? 0,
      sort: resolveSort(query.sort),
    })
  );
}

/** Published props by id (max 100), in no particular order. */
export function getPublishedPropsByIds(ids: string[]) {
  const clean = ids.map((s) => s.trim()).filter(Boolean).slice(0, 100);
  if (clean.length === 0) return Promise.resolve([] as Prop[]);
  return directus.request<Prop[]>(
    readItems("props", {
      fields: [...CARD_FIELDS],
      filter: { _and: [{ id: { _in: clean } }, { status: { _eq: "published" } }] },
      limit: 100,
    })
  );
}

/**
 * First page of results + total count for a browse view. Cached across requests
 * (cleared with the catalog when listings change) so revisiting a category or
 * town is fast. Searches aren't cached: every query is different.
 */
export async function getBrowseResults(query: PropQuery & { sort?: string | null }) {
  const run = async () => {
    const categoryIds = query.categoryIds ?? (await categoryIdsForSlug(query.category));
    const q = { ...query, categoryIds };
    const [items, countRows] = await Promise.all([
      getPropsPage(q),
      directus.request(readItems("props", { filter: buildPropFilter(q), aggregate: { count: "*" } })),
    ]);
    const total = parseInt(String((countRows as { count: string | number }[])[0]?.count ?? 0)) || 0;
    return { items, total };
  };

  if (query.search) return run();
  const key = JSON.stringify({
    category: query.categoryIds?.slice().sort() ?? query.category ?? null,
    loc: query.loc ?? null,
    vendor: query.vendor ?? null,
    sort: query.sort ?? null,
  });
  return unstable_cache(run, ["browse-v1", key], { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] })();
}
