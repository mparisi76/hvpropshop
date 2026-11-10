"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Select from "@/components/ui/Select";
import NearSearch from "@/components/browse/NearSearch";
import { SORT_OPTIONS, locationPath } from "@/lib/browse";

const RADII = [10, 25, 50, 100];
const isCoordinates = (v: string) => /^-?\d{1,2}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/.test(v.trim());

export default function BrowseControls({
  locations,
  currentLocation,
  nearLabel,
}: {
  locations: string[];
  /** Set on /prop-rentals/[place] pages, where the location is the page itself */
  currentLocation?: string;
  /** Resolved name of the current distance search, e.g. "Kingston, NY" */
  nearLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const near = searchParams.get("near") ?? "";
  const radius = searchParams.get("radius") ?? "25";
  const sortParam = searchParams.get("sort");
  const sort = sortParam ?? (near ? "nearest" : SORT_OPTIONS[0].value);


  const go = (path: string, params: URLSearchParams) => {
    const qs = params.toString();
    router.push(qs ? `${path}?${qs}` : path, { scroll: false });
  };

  /* ----- Distance search ----- */
  const setNear = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("loc"); // distance search replaces the exact-town filter
    if (value.trim()) params.set("near", value.trim());
    else {
      params.delete("near");
      params.delete("radius");
      if (params.get("sort") === "nearest") params.delete("sort");
    }
    go(pathname, params);
  };

  const setRadius = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "25") params.delete("radius");
    else params.set("radius", value);
    go(pathname, params);
  };

  /* ----- Town pages: switch between towns ----- */
  const setTownPage = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("loc");
    go(value ? locationPath(value) : "/", params);
  };

  /* ----- Sort ----- */
  const setSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const defaultSort = near ? "nearest" : SORT_OPTIONS[0].value;
    if (value === defaultSort) params.delete("sort");
    else params.set("sort", value);
    go(pathname, params);
  };

  const sortOptions = SORT_OPTIONS.filter((o) => o.value !== "nearest" || near);
  const townOptions =
    currentLocation && !locations.includes(currentLocation) ? [currentLocation, ...locations] : locations;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {currentLocation ? (
          <div className="w-48">
            <label htmlFor="browse-town" className="sr-only">Town</label>
            <Select id="browse-town" value={currentLocation} onChange={(e) => setTownPage(e.target.value)} className="h-9! py-1.5!">
              <option value="">All locations</option>
              {townOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <>
            <NearSearch key={near} near={near} vendorTowns={locations} onSearch={setNear} />

            {near && (
              <div className="w-28">
                <label htmlFor="browse-radius" className="sr-only">Distance</label>
                <Select id="browse-radius" value={radius} onChange={(e) => setRadius(e.target.value)} className="h-9! py-1.5!">
                  {RADII.map((r) => (
                    <option key={r} value={String(r)}>
                      {r} mi
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </>
        )}

        <div className="w-44">
          <label htmlFor="browse-sort" className="sr-only">Sort by</label>
          <Select id="browse-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="h-9! py-1.5!">
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {near && nearLabel && isCoordinates(near) && <p className="sr-only">Showing results near {nearLabel}</p>}
    </div>
  );
}
