"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Loader2, LocateFixed, MapPin, X } from "lucide-react";

interface Suggestion {
  label: string;
  value: string;
  /** One of our vendors' towns */
  local?: boolean;
}

const isCoordinates = (v: string) => /^-?\d{1,2}(\.\d+)?,\s*-?\d{1,3}(\.\d+)?$/.test(v.trim());

/**
 * "Near town or ZIP" box with suggestions as you type: our vendors' towns
 * first (instant), then any town/ZIP from OpenStreetMap via /api/places.
 * Remount with key={near} to reset after a search.
 */
export default function NearSearch({
  near,
  vendorTowns,
  onSearch,
}: {
  /** Current ?near= value */
  near: string;
  vendorTowns: string[];
  /** Run a search ("" clears it) */
  onSearch: (value: string) => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(near && isCoordinates(near) ? "My location" : near);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [remote, setRemote] = useState<Suggestion[]>([]);
  const [fetching, setFetching] = useState(false);
  /** The query the current `remote` results are for */
  const [fetchedFor, setFetchedFor] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = text.trim();
  // A ZIP in progress (1–4 digits): show a hint instead of searching
  const partialZip = /^\d{1,4}$/.test(query);
  const typing = open && query.length >= 2 && query !== near && !partialZip;

  // Remote suggestions, debounced; stale responses are ignored
  useEffect(() => {
    if (!typing) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = (await res.json()) as Suggestion[];
        if (!controller.signal.aborted) {
          setRemote(Array.isArray(data) ? data : []);
          setFetchedFor(query);
        }
      } catch {
        if (!controller.signal.aborted) {
          setRemote([]);
          setFetchedFor(query);
        }
      } finally {
        if (!controller.signal.aborted) setFetching(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, typing]);

  // Vendor towns that match what's typed, then remote places not already listed
  const suggestions = useMemo<Suggestion[]>(() => {
    if (!typing) return [];
    const q = query.toLowerCase();
    const local = vendorTowns
      .filter((t) => t.toLowerCase().includes(q))
      .sort((a, b) => Number(!a.toLowerCase().startsWith(q)) - Number(!b.toLowerCase().startsWith(q)))
      .slice(0, 4)
      .map((t) => ({ label: t, value: t, local: true }));
    const localLabels = new Set(local.map((l) => l.label.toLowerCase()));
    return [...local, ...remote.filter((r) => !localLabels.has(r.label.toLowerCase()))].slice(0, 8);
  }, [typing, query, vendorTowns, remote]);

  // Nothing found for what's typed (only once the lookup for this exact text has finished)
  const noMatch = typing && !fetching && suggestions.length === 0 && fetchedFor === query;
  const showList =
    (typing && (suggestions.length > 0 || fetching || noMatch)) || (open && partialZip && query !== near);

  const choose = (s: Suggestion) => {
    setText(s.label);
    setOpen(false);
    setError(null);
    onSearch(s.value);
  };

  const submit = () => {
    setOpen(false);
    setError(null);
    if (text === "My location" && isCoordinates(near)) return; // unchanged
    onSearch(query);
  };

  const useMyLocation = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError("Your browser can't share its location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        // ~100 m precision is plenty, and keeps exact positions out of URLs
        onSearch(`${pos.coords.latitude.toFixed(3)},${pos.coords.longitude.toFixed(3)}`);
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location. Type a town or ZIP instead.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && suggestions.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showList && active >= 0 && suggestions[active]) choose(suggestions[active]);
      else submit();
    }
  };

  return (
    <div className="relative w-56">
      <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setActive(-1);
          setError(null);
        }}
        onFocus={(e) => {
          if (text === "My location") e.currentTarget.select();
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="Near town or ZIP"
        aria-label="Near town or ZIP"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className="input h-9! py-1.5! pl-8! pr-16!"
      />
      <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
        {(near || text) && (
          <button
            type="button"
            onClick={() => {
              setText("");
              setError(null);
              if (near) onSearch("");
              inputRef.current?.focus();
            }}
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

      {showList && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg">
          <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto py-1">
            {suggestions.map((s, i) => (
              <li
                key={`${s.local ? "v" : "p"}-${s.label}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown (not click) so it fires before the input loses focus
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-sm ${
                  i === active ? "bg-neutral-100" : ""
                }`}
              >
                <span className="truncate">{s.label}</span>
                {s.local && <span className="shrink-0 text-[11px] font-medium text-accent">Has vendors</span>}
              </li>
            ))}
            {partialZip && (
              <li className="px-3 py-1.5 text-sm text-neutral-500">Keep typing: enter all 5 digits of the ZIP</li>
            )}
            {noMatch && (
              <li className="px-3 py-1.5 text-sm text-neutral-500">
                No matching places. Press Enter to search anyway.
              </li>
            )}
            {fetching && suggestions.length === 0 && (
              <li className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Searching…
              </li>
            )}
          </ul>
          {remote.length > 0 && (
            <p className="border-t border-neutral-100 px-3 py-1 text-[10px] text-neutral-400">
              Places © OpenStreetMap contributors
            </p>
          )}
        </div>
      )}

      {error && <p className="absolute left-0 top-full mt-1 w-72 text-xs text-red-700">{error}</p>}
    </div>
  );
}
