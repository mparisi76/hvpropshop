import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BrowseView from "@/components/browse/BrowseView";
import JsonLd from "@/components/JsonLd";
import { findCategory, getCatalog } from "@/lib/catalog";
import { categoryPath } from "@/lib/browse";
import { absoluteUrl, pageMeta } from "@/lib/seo";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ search?: string; loc?: string; sort?: string }>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const [{ slug }, { search, loc, sort }] = await Promise.all([params, searchParams]);
  const found = findCategory((await getCatalog()).tree, decodeURIComponent(slug));
  if (!found) return { title: "Category not found | HV Prop Shop", robots: { index: false } };

  const name = found.current.name;
  return pageMeta({
    title: `${name} rentals for film & TV — Hudson Valley to NYC | HV Prop Shop`,
    description: `Rent ${name.toLowerCase()} props and set dressing from independent vendors across the Hudson Valley and New York City. ${
      found.current.count
    } ${found.current.count === 1 ? "item" : "items"} available.`,
    path: categoryPath(found.current.slug),
    // Empty categories and filtered views don't belong in search results
    noindex: found.current.count === 0 || Boolean(search || loc || sort),
  });
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ slug: rawSlug }, query] = await Promise.all([params, searchParams]);
  const slug = decodeURIComponent(rawSlug);
  const catalog = await getCatalog();
  const found = findCategory(catalog.tree, slug);
  if (!found) notFound();

  const { current, parent } = found;
  const crumbs = [
    { name: "All inventory", url: absoluteUrl("/") },
    ...(parent ? [{ name: parent.name, url: absoluteUrl(categoryPath(parent.slug)) }] : []),
    { name: current.name, url: absoluteUrl(categoryPath(current.slug)) },
  ];

  return (
    <BrowseView
      category={slug}
      search={query.search}
      loc={query.loc}
      sort={query.sort}
      hero={
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
            }}
          />
          <section className="border-b border-neutral-200 bg-neutral-50">
            <div className="container-page py-8 md:py-10">
              {parent && (
                <Link href={categoryPath(parent.slug)} className="eyebrow hover:text-neutral-900">
                  {parent.name}
                </Link>
              )}
              <h1 className="mt-1 max-w-2xl text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
                {current.name} rentals
              </h1>
              <p className="mt-2 max-w-2xl text-neutral-600">
                {current.count > 0
                  ? `${current.count.toLocaleString()} ${current.name.toLowerCase()} ${
                      current.count === 1 ? "piece" : "pieces"
                    } to rent for film, TV and photo, from independent vendors across the Hudson Valley and New York City.`
                  : `Nothing listed in ${current.name.toLowerCase()} yet. Check back soon, or browse everything.`}
              </p>
            </div>
          </section>
        </>
      }
    />
  );
}
