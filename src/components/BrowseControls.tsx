"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Select from "@/components/ui/Select";
import { SORT_OPTIONS, locationPath } from "@/lib/browse";

export default function BrowseControls({
  locations,
  currentLocation,
}: {
  locations: string[];
  /** Set on /prop-rentals/[place] pages, where the location is the page itself */
  currentLocation?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loc = currentLocation ?? searchParams.get("loc") ?? "";
  const sort = searchParams.get("sort") ?? SORT_OPTIONS[0].value;

  const go = (path: string, params: URLSearchParams) => {
    const qs = params.toString();
    router.push(qs ? `${path}?${qs}` : path, { scroll: false });
  };

  const setSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== SORT_OPTIONS[0].value) params.set("sort", value);
    else params.delete("sort");
    go(pathname, params);
  };

  const setLocation = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentLocation) {
      // Location pages: switch to another town's page, or back to all inventory
      params.delete("loc");
      go(value ? locationPath(value) : "/", params);
      return;
    }
    if (value) params.set("loc", value);
    else params.delete("loc");
    go(pathname, params);
  };

  // Keep a location that's selected via URL even if it's not in the list
  const locationOptions = loc && !locations.includes(loc) ? [loc, ...locations] : locations;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {locationOptions.length > 0 && (
        <div className="w-48">
          <label htmlFor="browse-loc" className="sr-only">Pickup location</label>
          <Select id="browse-loc" value={loc} onChange={(e) => setLocation(e.target.value)} className="h-9! py-1.5!">
            <option value="">All locations</option>
            {locationOptions.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="w-48">
        <label htmlFor="browse-sort" className="sr-only">Sort by</label>
        <Select id="browse-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="h-9! py-1.5!">
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
