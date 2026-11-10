import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import BrowseView from "@/components/browse/BrowseView";
import JsonLd from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog";
import { categoryPath } from "@/lib/browse";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_TAGLINE, absoluteUrl, pageMeta } from "@/lib/seo";

type SearchParams = Promise<{ category?: string; search?: string; loc?: string; sort?: string; near?: string; radius?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { search, loc, sort, near } = await searchParams;
  // Search results and filtered/sorted views shouldn't compete with real pages in search
  if (search) return pageMeta({ title: `"${search}" | HV Prop Shop`, noindex: true });
  return pageMeta({ title: `${SITE_NAME} | ${SITE_TAGLINE}`, path: "/", noindex: Boolean(loc || sort || near) });
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // Old category links (/?category=x) → /rentals/x, keeping any other filters
  if (params.category) {
    const rest = new URLSearchParams();
    for (const key of ["search", "loc", "sort", "near", "radius"] as const) if (params[key]) rest.set(key, params[key]!);
    const qs = rest.toString();
    permanentRedirect(`${categoryPath(params.category)}${qs ? `?${qs}` : ""}`);
  }

  const catalog = await getCatalog();
  const isPlain = !params.search && !params.loc && !params.near;

  return (
    <>
      {isPlain && (
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_NAME,
              url: absoluteUrl("/"),
              logo: absoluteUrl("/opengraph-image"),
              description: DEFAULT_DESCRIPTION,
              areaServed: ["Hudson Valley, NY", "New York, NY"],
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              url: absoluteUrl("/"),
              potentialAction: {
                "@type": "SearchAction",
                target: `${absoluteUrl("/")}?search={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />
      )}
      <BrowseView
        search={params.search}
        loc={params.loc}
        sort={params.sort}
        near={params.near}
        radius={Number(params.radius) || undefined}
        title="Props and set dressing for film, TV and photo."
        intro="Rent directly from independent vendors across the Hudson Valley and New York City."
        extra={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <p className="text-neutral-700">
              <span className="font-semibold tabular-nums">{catalog.itemCount.toLocaleString()}</span> items ·{" "}
              <span className="font-semibold tabular-nums">{catalog.vendorCount}</span>{" "}
              {catalog.vendorCount === 1 ? "vendor" : "vendors"}
            </p>
            <Link href="/vendors" className="link">Browse vendors</Link>
            <Link href="/prop-rentals" className="link">Browse by town</Link>
            <Link href="/how-it-works" className="link">How it works</Link>
          </div>
        }
      />
    </>
  );
}