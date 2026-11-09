/** Shared SEO helpers. */

export const SITE_NAME = "HV Prop Shop";
export const SITE_TAGLINE = "Prop & set dressing rentals, Hudson Valley to NYC";
export const DEFAULT_DESCRIPTION =
  "Rent props and set dressing from independent vendors across the Hudson Valley and New York City.";

/** Public base URL (no trailing slash), read at runtime when SITE_URL is set. */
export function baseUrl() {
  return (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://hvpropshop.com").replace(/\/$/, "");
}

export const absoluteUrl = (path = "/") => `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

/** A Directus image sized for link previews (1200×630). */
export function previewImage(fileId: string, fit: "cover" | "inside" = "cover") {
  return `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${fileId}?width=1200&height=630&fit=${fit}&format=jpg&quality=80`;
}

/** HTML → plain text, trimmed to a search-snippet length at a word boundary. */
export function plainText(html: string | null | undefined, max = 155) {
  const text = (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(" ", max - 1) || max - 1)}…`;
}

/**
 * Complete metadata for a page. Next.js replaces (doesn't merge) nested
 * openGraph/twitter objects, so every page should build them here.
 */
export function pageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  imageAlt,
  noindex = false,
}: {
  title: string;
  description?: string;
  /** Canonical path, e.g. "/props/12" */
  path?: string;
  /** Absolute image URL for link previews (defaults to the site image) */
  image?: string | null;
  imageAlt?: string;
  noindex?: boolean;
}) {
  const images = image ? [{ url: image, width: 1200, height: 630, alt: imageAlt ?? title }] : undefined;
  return {
    title,
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website" as const,
      siteName: SITE_NAME,
      locale: "en_US",
      title,
      description,
      ...(path ? { url: path } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}
