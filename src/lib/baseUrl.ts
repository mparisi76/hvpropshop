import { headers } from "next/headers";
import { siteUrl } from "@/lib/site";

/**
 * Absolute base URL (no trailing slash) for links in emails and Stripe redirects.
 * Uses NEXT_PUBLIC_URL / NEXT_PUBLIC_SITE_URL when set; otherwise works it out
 * from the current request, so a missing env var can't produce broken links.
 */
export async function getSiteUrl() {
  const configured = siteUrl();
  if (/^https?:\/\//.test(configured)) return configured;

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // Not in a request (shouldn't happen for our callers)
  }
  console.warn("[site] NEXT_PUBLIC_URL isn't set and the request host is unknown; using https://hvpropshop.com");
  return "https://hvpropshop.com";
}
