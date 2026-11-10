import { readItems } from "@directus/sdk";
import directus from "@/lib/directus";
import { Prop } from "@/types";
import { parseLocation, resolveSort } from "@/lib/browse";
import { unstable_cache } from "next/cache";
import { CATALOG_TAG, CATALOG_TTL, categoryIdsForSlug } from "@/lib/catalog";
import { parseRadius, resolveNear, vendorsNear } from "@/lib/geo";

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
  /** Only items from these vendors (used by distance search) */
  vendorIds?: string[] | null;
  /** Distance search: a town, ZIP, or "lat,lng" from the browser */
  near?: string | null;
  /** Distance search radius in miles */
  radius?: number | null;
}

/** Result of a browse query. `near` is set for distance searches. */
export interface PropResults {
  items: Prop[];
  total: number;
  near?: { label: string; radius: number } | { notFound: true; query: string };
}

/** Directus filter for published props matching the query. */
export function buildPropFilter({ category, categoryIds, search, vendor, loc, vendorIds }: PropQuery) {
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

  if (vendorIds) {
    and.push({ user_created: { _in: vendorIds.length ? vendorIds : ["00000000-0000-0000-0000-000000000000"] } });
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
/**
 * One page of results plus the total, for browse pages and "Load more".
 * Distance searches (`near`) filter to nearby vendors and, by default, sort
 * nearest first — done here since Directus can't sort by computed distance.
 */
export async function queryProps(
  query: PropQuery & { sort?: string | null; offset?: number }
): Promise<PropResults> {
  const offset = query.offset ?? 0;
  const categoryIds = query.categoryIds ?? (await categoryIdsForSlug(query.category));
  const base = { ...query, categoryIds };

  const count = async (filter: Record<string, unknown>) => {
    const rows = (await directus.request(readItems("props", { filter, aggregate: { count: "*" } }))) as unknown as {
      count: string | number;
    }[];
    return parseInt(String(rows[0]?.count ?? 0)) || 0;
  };

  if (!query.near) {
    const filter = buildPropFilter(base);
    const [items, total] = await Promise.all([
      directus.request<Prop[]>(
        readItems("props", {
          fields: [...CARD_FIELDS],
          filter,
          limit: PAGE_SIZE,
          offset,
          sort: resolveSort(query.sort),
        })
      ),
      count(filter),
    ]);
    return { items, total };
  }

  // ---- Distance search ----
  const origin = await resolveNear(query.near).catch(() => null);
  if (!origin) return { items: [], total: 0, near: { notFound: true, query: query.near } };
  const radius = parseRadius(String(query.radius ?? ""));
  const nearby = await vendorsNear(origin, radius);
  const milesByVendor = new Map(nearby.map((v) => [v.id, v.miles]));
  const near = { label: origin.label, radius };
  if (nearby.length === 0) return { items: [], total: 0, near };

  const filter = buildPropFilter({ ...base, vendorIds: [...milesByVendor.keys()] });
  const withDistance = (items: Prop[]) =>
    items.map((i) => ({ ...i, distance: milesByVendor.get(String(i.user_created?.id ?? "")) }));

  if (query.sort && query.sort !== "nearest") {
    const [items, total] = await Promise.all([
      directus.request<Prop[]>(
        readItems("props", { fields: [...CARD_FIELDS], filter, limit: PAGE_SIZE, offset, sort: resolveSort(query.sort) })
      ),
      count(filter),
    ]);
    return { items: withDistance(items), total, near };
  }

  // Nearest first: rank every match by its vendor's distance, then load just this page
  const all = (await directus.request(
    readItems("props", { fields: ["id", { user_created: ["id"] }], filter, sort: ["-date_created"], limit: -1 })
  )) as unknown as { id: string | number; user_created: { id: string } | null }[];
  const ranked = all
    .map((r, i) => ({ id: String(r.id), miles: milesByVendor.get(String(r.user_created?.id ?? "")) ?? Infinity, i }))
    .sort((a, b) => a.miles - b.miles || a.i - b.i);
  const pageIds = ranked.slice(offset, offset + PAGE_SIZE).map((r) => r.id);
  const pageItems = pageIds.length
    ? await directus.request<Prop[]>(
        readItems("props", { fields: [...CARD_FIELDS], filter: { id: { _in: pageIds } }, limit: PAGE_SIZE })
      )
    : [];
  const byId = new Map(pageItems.map((p) => [String(p.id), p]));
  const items = pageIds.map((id) => byId.get(id)).filter((p): p is Prop => Boolean(p));
  return { items: withDistance(items), total: ranked.length, near };
}

/** One page of items (used by "Load more"). */
export async function getPropsPage(query: PropQuery & { sort?: string | null; offset?: number }) {
  return (await queryProps(query)).items;
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
export async function getBrowseResults(query: PropQuery & { sort?: string | null }): Promise<PropResults> {
  const run = () => queryProps({ ...query, offset: 0 });

  // Searches and distance searches aren't cached: too many combinations
  if (query.search || query.near) return run();
  const key = JSON.stringify({
    category: query.categoryIds?.slice().sort() ?? query.category ?? null,
    loc: query.loc ?? null,
    vendor: query.vendor ?? null,
    sort: query.sort ?? null,
  });
  return unstable_cache(run, ["browse-v2", key], { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] })();
}
