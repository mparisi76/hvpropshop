/**
 * Browse helpers with no server dependencies — safe to import from client components.
 */

/* ---------- Sorting ---------- */

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest", sort: ["-date_created"] },
  { value: "price_asc", label: "Price: low to high", sort: ["price", "-date_created"] },
  { value: "price_desc", label: "Price: high to low", sort: ["-price", "-date_created"] },
  { value: "name", label: "Name: A–Z", sort: ["name"] },
  // Only offered with a "near" search, where it's the default (sorted in code by distance)
  { value: "nearest", label: "Nearest", sort: ["-date_created"] },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function resolveSort(value?: string | null) {
  return (SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0]).sort as unknown as string[];
}

/* ---------- Location ("City, ST") ---------- */

export function formatLocation(city?: string | null, state?: string | null) {
  return [city?.trim(), state?.trim()].filter(Boolean).join(", ");
}

export function parseLocation(loc: string) {
  const i = loc.lastIndexOf(", ");
  return i === -1
    ? { city: loc.trim(), state: "" }
    : { city: loc.slice(0, i).trim(), state: loc.slice(i + 2).trim() };
}

/* ---------- Links ---------- */

/** Browse URL for a category (/rentals/slug), carrying over other params (e.g. "loc=…&sort=…"). */
export function categoryHref(keepQuery: string, slug?: string) {
  const qs = new URLSearchParams(keepQuery).toString();
  const path = slug ? `/rentals/${encodeURIComponent(slug)}` : "/";
  return qs ? `${path}?${qs}` : path;
}

/* ---------- Clean URLs ---------- */

/** "Cleared Art & Signs" → "cleared-art-signs" */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "Kingston, NY" → "kingston-ny" */
export const locationSlug = slugify;

/** A category's slug, made from its name if Directus doesn't have one. */
export const categorySlug = (c: { slug?: string | null; name: string }) => c.slug?.trim() || slugify(c.name);

export const categoryPath = (slug: string) => `/rentals/${encodeURIComponent(slug)}`;
export const locationPath = (label: string) => `/prop-rentals/${locationSlug(label)}`;
