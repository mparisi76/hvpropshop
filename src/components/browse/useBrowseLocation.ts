"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * The selected category and the params to carry between categories, read from
 * the URL. Used by the sidebar/chips, which live in the browse layout and stay
 * on screen while pages change underneath them.
 */
export function useBrowseLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const match = pathname.match(/^\/rentals\/([^/]+)/);
  const selectedSlug = match ? decodeURIComponent(match[1]) : undefined;

  // Category links keep the location filter and sort (not the search)
  const keep = new URLSearchParams();
  for (const key of ["loc", "sort"]) {
    const value = searchParams.get(key);
    if (value) keep.set(key, value);
  }

  return { selectedSlug, keepQuery: keep.toString() };
}
