import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import BrowseView from "@/components/browse/BrowseView";
import JsonLd from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog";
import { categoryPath } from "@/lib/browse";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_TAGLINE, absoluteUrl, pageMeta } from "@/lib/seo";

type SearchParams = Promise<{ category?: string; search?: string; loc?: string; sort?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { search, loc, sort } = await searchParams;
  // Search results and filtered/sorted views shouldn't compete with real pages in search
  if (search) return pageMeta({ title: `"${search}" | HV Prop Shop`, noindex: true });
  return pageMeta({ title: `${SITE_NAME} | ${SITE_TAGLINE}`, path: "/", noindex: Boolean(loc || sort) });
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // Old category links (/?category=x) → /rentals/x, keeping any other filters
  if (params.category) {
    const rest = new URLSearchParams();
    for (const key of ["search", "loc", "sort"] as const) if (params[key]) rest.set(key, params[key]!);
    const qs = rest.toString();
    permanentRedirect(`${categoryPath(params.category)}${qs ? `?${qs}` : ""}`);
  }

  const catalog = await getCatalog();
  const isPlain = !params.search && !params.loc;

  return (
    <BrowseView
      search={params.search}
      loc={params.loc}
      sort={params.sort}
      hero={
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
          <section className="border-b border-neutral-200 bg-neutral-50">
            <div className="container-page py-8 md:py-10">
              <h1 className="max-w-2xl text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
                Props and set dressing for film, TV and photo.
              </h1>
              <p className="mt-2 max-w-2xl text-neutral-600">
                Rent directly from independent vendors across the Hudson Valley and New York City.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <p className="text-neutral-700">
                  <span className="font-semibold tabular-nums">{catalog.itemCount.toLocaleString()}</span> items ·{" "}
                  <span className="font-semibold tabular-nums">{catalog.vendorCount}</span>{" "}
                  {catalog.vendorCount === 1 ? "vendor" : "vendors"}
                </p>
                <Link href="/vendors" className="link">Browse vendors</Link>
                <Link href="/prop-rentals" className="link">Browse by town</Link>
                <Link href="/how-it-works" className="link">How it works</Link>
              </div>
            </div>
          </section>
        </>
      }
    />
  );
}
