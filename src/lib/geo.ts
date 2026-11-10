import { unstable_cache } from "next/cache";
import { readUsers, updateUser } from "@directus/sdk";
import { asServer } from "@/lib/serverDirectus";
import { CATALOG_TAG, CATALOG_TTL } from "@/lib/catalog";

export interface Point {
  lat: number;
  lng: number;
}

/* ---------- Distance ---------- */

/** Straight-line distance in miles between two points. */
export function milesBetween(a: Point, b: Point) {
  const R = 3958.8; // Earth radius, miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const RADIUS_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_RADIUS = 25;

export function parseRadius(value: string | null | undefined) {
  const n = Number(value);
  return (RADIUS_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_RADIUS;
}

/* ---------- Geocoding (OpenStreetMap Nominatim) ---------- */

// Nominatim's usage policy: at most 1 request per second, with an identifying
// User-Agent. Requests are queued and spaced out, and results cached for 30 days.
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "HVPropShop/1.0 (+https://hvpropshop.com)";
let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = lastRequestAt + 1100 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return fn();
  });
  queue = run.catch(() => {});
  return run;
}

async function lookup(query: string): Promise<(Point & { label: string }) | null> {
  const params = new URLSearchParams({ format: "jsonv2", limit: "1", countrycodes: "us", addressdetails: "1" });
  if (/^\d{5}$/.test(query)) params.set("postalcode", query);
  else params.set("q", query);

  const res = await throttled(() =>
    fetch(`${NOMINATIM}?${params.toString()}`, { headers: { "User-Agent": USER_AGENT }, cache: "no-store" })
  );
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const [hit] = (await res.json()) as {
    lat: string;
    lon: string;
    display_name: string;
    address?: { city?: string; town?: string; village?: string; hamlet?: string; postcode?: string; state?: string };
  }[];
  if (!hit) return null;

  const a = hit.address ?? {};
  const place = a.city || a.town || a.village || a.hamlet;
  const state = a.state ? STATE_ABBR[a.state] ?? a.state : "";
  const label = /^\d{5}$/.test(query)
    ? [query, place].filter(Boolean).join(" · ")
    : [place, state].filter(Boolean).join(", ") || hit.display_name.split(",").slice(0, 2).join(",");
  return { lat: Number(hit.lat), lng: Number(hit.lon), label };
}

const cachedLookup = unstable_cache(lookup, ["geocode-v1"], { revalidate: 60 * 60 * 24 * 30 });

/** A town, "Town, ST" or ZIP → coordinates and a tidy label. null if not found. */
export async function geocode(query: string) {
  const q = query.trim().replace(/\s+/g, " ").slice(0, 120);
  if (!q) return null;
  return cachedLookup(q.toLowerCase());
}

/** "41.93,-74.02" (from "Use my location") → a point, else null. */
export function parseCoordinates(value: string): Point | null {
  const m = value.trim().match(/^(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

/** Resolve the ?near= value: coordinates from the browser, or a town/ZIP to look up. */
export async function resolveNear(near: string): Promise<(Point & { label: string }) | null> {
  const coords = parseCoordinates(near);
  if (coords) return { ...coords, label: "your location" };
  return geocode(near);
}

/* ---------- Vendor coordinates (directus_users.latitude / longitude) ---------- */

/** All vendors' coordinates, read with the server token (not public), cached with the catalog. */
export const getVendorCoordinates = unstable_cache(
  async () => {
    const rows = (await asServer(
      readUsers({
        fields: ["id", "latitude", "longitude"],
        filter: { _and: [{ latitude: { _nnull: true } }, { longitude: { _nnull: true } }] },
        limit: -1,
      })
    )) as unknown as { id: string; latitude: number | string; longitude: number | string }[];
    return rows.map((r) => ({ id: String(r.id), lat: Number(r.latitude), lng: Number(r.longitude) }));
  },
  ["vendor-coords-v1"],
  { revalidate: CATALOG_TTL, tags: [CATALOG_TAG] }
);

/** Vendors within `radius` miles of `origin`, nearest first. */
export async function vendorsNear(origin: Point, radius: number) {
  const vendors = await getVendorCoordinates().catch(() => []);
  return vendors
    .map((v) => ({ id: v.id, miles: milesBetween(origin, v) }))
    .filter((v) => v.miles <= radius)
    .sort((a, b) => a.miles - b.miles);
}

/**
 * Look up a vendor's town and save its coordinates (server token). Best effort:
 * returns false if the town can't be found or the fields don't exist yet.
 */
export async function setVendorCoordinates(vendorId: string, city?: string | null, state?: string | null) {
  const place = [city?.trim(), state?.trim()].filter(Boolean).join(", ");
  try {
    const hit = place ? await geocode(place) : null;
    await asServer(
      updateUser(vendorId, {
        latitude: hit?.lat ?? null,
        longitude: hit?.lng ?? null,
      } as unknown as Parameters<typeof updateUser>[1])
    );
    return Boolean(hit);
  } catch (error) {
    console.warn(`[geo] Couldn't set coordinates for vendor ${vendorId} (${place}):`, error);
    return false;
  }
}

/** Fill in coordinates for vendors that have a town but no position yet (daily job). */
export async function backfillVendorCoordinates(max = 25) {
  const rows = (await asServer(
    readUsers({
      fields: ["id", "city", "state"],
      filter: { _and: [{ latitude: { _null: true } }, { city: { _nnull: true } }, { city: { _nempty: true } }] },
      limit: max,
    })
  )) as unknown as { id: string; city: string | null; state: string | null }[];
  let updated = 0;
  for (const r of rows) if (await setVendorCoordinates(r.id, r.city, r.state)) updated++;
  return { checked: rows.length, updated };
}

const STATE_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA", Colorado: "CO", Connecticut: "CT",
  Delaware: "DE", "District of Columbia": "DC", Florida: "FL", Georgia: "GA", Hawaii: "HI", Idaho: "ID", Illinois: "IL",
  Indiana: "IN", Iowa: "IA", Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS", Missouri: "MO", Montana: "MT", Nebraska: "NE",
  Nevada: "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC",
  "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA",
  Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
};
