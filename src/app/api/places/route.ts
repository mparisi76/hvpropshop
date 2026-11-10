import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { geocode } from "@/lib/geo";

/**
 * Place suggestions for the "Near town or ZIP" box (search-as-you-type).
 * Uses Photon (photon.komoot.io), an OpenStreetMap geocoder that allows
 * autocomplete (Nominatim doesn't). Limited to the NY/NJ/CT/PA area, biased
 * toward the Hudson Valley, and cached.
 */

export interface PlaceSuggestion {
  /** Shown in the list: "Kingston, NY" or "12401 · Kingston, NY" */
  label: string;
  /** What gets searched: "Kingston, NY" or "12401" */
  value: string;
}

const PHOTON = "https://photon.komoot.io/api/";
// Roughly NY, NJ, CT, western MA/VT and northeast PA
const BBOX = "-80.6,38.9,-71.8,45.1";
const PLACE_TAGS = ["place:city", "place:town", "place:village", "place:hamlet", "place:suburb", "place:neighbourhood"];

const STATE_ABBR: Record<string, string> = {
  "New York": "NY", "New Jersey": "NJ", Connecticut: "CT", Pennsylvania: "PA",
  Massachusetts: "MA", Vermont: "VT", "Rhode Island": "RI", Delaware: "DE", Maryland: "MD",
};

async function fetchSuggestions(q: string): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({ q, limit: "8", lang: "en", lat: "41.75", lon: "-74.0", bbox: BBOX });
  for (const tag of PLACE_TAGS) params.append("osm_tag", tag);

  const res = await fetch(`${PHOTON}?${params.toString()}`, {
    headers: { "User-Agent": "HVPropShop/1.0 (+https://hvpropshop.com)" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = (await res.json()) as {
    features: { properties: { name?: string; city?: string; state?: string; postcode?: string; countrycode?: string } }[];
  };

  const seen = new Set<string>();
  const out: PlaceSuggestion[] = [];
  for (const { properties: p } of data.features ?? []) {
    if (p.countrycode && p.countrycode !== "US") continue;
    const state = p.state ? STATE_ABBR[p.state] ?? p.state : "";
    const label = [p.name, state].filter(Boolean).join(", ");
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({ label, value: label });
    if (out.length >= 6) break;
  }
  return out;
}

const cached = unstable_cache(fetchSuggestions, ["places-v1"], { revalidate: 60 * 60 * 24 * 7 });

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
  if (q.length < 2) return NextResponse.json([]);

  // ZIP codes: Photon handles these poorly, so look a complete ZIP up exactly
  // (same cached lookup the search uses). Partial ZIPs get a hint in the UI.
  if (/^\d+$/.test(q)) {
    if (q.length !== 5) return NextResponse.json([]);
    try {
      const hit = await geocode(q);
      return NextResponse.json(hit ? [{ label: hit.label, value: q }] : [], {
        headers: { "Cache-Control": "public, max-age=86400" },
      });
    } catch (error) {
      console.warn("[places] ZIP lookup failed:", error);
      return NextResponse.json([]);
    }
  }
  try {
    return NextResponse.json(await cached(q.toLowerCase()), {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (error) {
    console.warn("[places] Suggestions failed:", error);
    return NextResponse.json([]); // suggestions are optional — typing + Enter still works
  }
}
