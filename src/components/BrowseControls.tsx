"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, LocateFixed, MapPin, X } from "lucide-react";
import Select from "@/components/ui/Select";
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

  const inputRef = useRef<HTMLInputElement>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

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

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocateError("Your browser can't share its location.");
      return;
    }
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        // ~100 m precision is plenty, and keeps exact positions out of URLs
        setNear(`${pos.coords.latitude.toFixed(3)},${pos.coords.longitude.toFixed(3)}`);
      },
      () => {
        setLocating(false);
        setLocateError("Couldn't get your location. Type a town or ZIP instead.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
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
  const shownNear = near && isCoordinates(near) ? "My location" : near;

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
            <form
              role="search"
              aria-label="Search near a town or ZIP"
              onSubmit={(e) => {
                e.preventDefault();
                setNear(inputRef.current?.value ?? "");
              }}
              className="relative w-52"
            >
              <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
              <input
                key={near}
                ref={inputRef}
                name="near"
                defaultValue={shownNear}
                placeholder="Near town or ZIP"
                aria-label="Near town or ZIP"
                autoComplete="postal-code"
                onFocus={(e) => near && isCoordinates(near) && e.currentTarget.select()}
                className="input h-9! py-1.5! pl-8! pr-16!"
              />
              <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
                {near && (
                  <button
                    type="button"
                    onClick={() => setNear("")}
                    className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                    aria-label="Clear location"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locating}
                  className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  aria-label="Use my location"
                  title="Use my location"
                >
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                </button>
              </div>
            </form>

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
      {locateError && <p className="text-xs text-red-700">{locateError}</p>}
      {near && nearLabel && isCoordinates(near) && <p className="sr-only">Showing results near {nearLabel}</p>}
    </div>
  );
}
