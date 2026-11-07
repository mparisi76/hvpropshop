import { readItems } from "@directus/sdk";
import directus from "@/lib/directus";
import { Prop } from "@/types";
import { parseLocation, resolveSort } from "@/lib/browse";

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
}

/** Directus filter for published props matching the query. */
export function buildPropFilter({ category, search, vendor, loc }: PropQuery) {
  const and: Record<string, unknown>[] = [{ status: { _eq: "published" } }];

  if (category) {
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
export function getPropsPage(query: PropQuery & { sort?: string | null; offset?: number }) {
  return directus.request<Prop[]>(
    readItems("props", {
      fields: [...CARD_FIELDS],
      filter: buildPropFilter(query),
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
