"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Select from "@/components/ui/Select";
import { SORT_OPTIONS } from "@/lib/browse";

export default function BrowseControls({ locations }: { locations: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loc = searchParams.get("loc") ?? "";
  const sort = searchParams.get("sort") ?? SORT_OPTIONS[0].value;

  const setParam = (key: string, value: string, defaultValue = "") => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== defaultValue) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/", { scroll: false });
  };

  // Keep a location that's selected via URL even if it's not in the list
  const locationOptions = loc && !locations.includes(loc) ? [loc, ...locations] : locations;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {locationOptions.length > 0 && (
        <div className="w-48">
          <label htmlFor="browse-loc" className="sr-only">Pickup location</label>
          <Select
            id="browse-loc"
            value={loc}
            onChange={(e) => setParam("loc", e.target.value)}
            className="h-9! py-1.5!"
          >
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
        <Select
          id="browse-sort"
          value={sort}
          onChange={(e) => setParam("sort", e.target.value, SORT_OPTIONS[0].value)}
          className="h-9! py-1.5!"
        >
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
