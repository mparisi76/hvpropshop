import type { MetadataRoute } from "next";
import { readItems } from "@directus/sdk";
import directus from "@/lib/directus";
import { getVendors } from "@/lib/vendors";
import { absoluteUrl } from "@/lib/seo";
import { withOptionalField } from "@/lib/fields";
import { categoryPath, categorySlug, locationPath } from "@/lib/browse";
import { getCatalog } from "@/lib/catalog";

// Rebuild at most once an hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/vendors"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/prop-rentals"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/how-it-works"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/sell"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/about"), changeFrequency: "yearly", priority: 0.4 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/policies"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
  ];

  const [props, categories, vendors] = await Promise.all([
    // date_updated is optional — fall back to date_created if the field doesn't exist
    withOptionalField(
      "date_updated",
      () =>
        directus.request(
          readItems("props", {
            fields: ["id", "date_updated", "date_created"],
            filter: { status: { _eq: "published" } },
            limit: -1,
          })
        ),
      () =>
        directus.request(
          readItems("props", { fields: ["id", "date_created"], filter: { status: { _eq: "published" } }, limit: -1 })
        )
    ).catch((error) => {
      console.error("[sitemap] Couldn't load listings:", error);
      return [];
    }) as Promise<{ id: string | number; date_updated?: string | null; date_created?: string | null }[]>,
    directus
      .request(readItems("categories", { fields: ["slug", "name"], limit: -1 }))
      .catch(() => []) as Promise<{ slug: string | null; name: string }[]>,
    getVendors().catch(() => []),
  ]);
  const { locations } = await getCatalog().catch(() => ({ locations: [] as { label: string }[] }));

  return [
    ...staticPages,
    ...categories
      .filter((c) => c.slug || c.name)
      .map((c) => ({
        url: absoluteUrl(categoryPath(categorySlug(c))),
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ...props.map((p) => {
      const updated = p.date_updated ?? p.date_created;
      return {
        url: absoluteUrl(`/props/${p.id}`),
        ...(updated ? { lastModified: new Date(updated) } : {}),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    }),
    ...locations.map((l) => ({
      url: absoluteUrl(locationPath(l.label)),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...vendors.map((v) => ({
      url: absoluteUrl(`/vendors/${v.id}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
