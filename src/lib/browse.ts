/**
 * Browse helpers with no server dependencies — safe to import from client components.
 */

/* ---------- Sorting ---------- */

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest", sort: ["-date_created"] },
  { value: "price_asc", label: "Price: low to high", sort: ["price", "-date_created"] },
  { value: "price_desc", label: "Price: high to low", sort: ["-price", "-date_created"] },
  { value: "name", label: "Name: A–Z", sort: ["name"] },
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

/** Browse URL for a category, carrying over other params (e.g. "loc=…&sort=…"). */
export function categoryHref(keepQuery: string, slug?: string) {
  const p = new URLSearchParams(keepQuery);
  if (slug) p.set("category", slug);
  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}
