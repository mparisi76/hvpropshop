import { readItems } from "@directus/sdk";
import directus from "@/lib/directus";
import CategorySidebar from "@/components/CategorySidebar";
import { Category, Prop } from "@/types";
import { getCategoryTree } from "@/lib/utils";
import MobileCategoryBar from "@/components/MobileCategoryBar";
import PropFeed from "@/components/PropFeed";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import BrowseControls from "@/components/BrowseControls";
import { buildPropFilter, getPropsPage } from "@/lib/props";
import { formatLocation } from "@/lib/browse";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}): Promise<Metadata> {
  const { category, search } = await searchParams;

  let title = "HV Prop Shop | Prop & set dressing rentals, Hudson Valley to NYC";

  if (search) {
    title = `"${search}" | HV Prop Shop`;
  } else if (category) {
    const catName = category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    title = `${catName} Rentals | HV Prop Shop`;
  }

  return {
    title,
    description:
      "Rent props and set dressing from independent vendors across the Hudson Valley and New York City.",
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; loc?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const selectedSlug = params.category;
  const searchQuery = params.search?.toLowerCase();

  const loc = params.loc || undefined;
  const sort = params.sort || undefined;
  const query = { category: selectedSlug, search: searchQuery, loc };

  const [initialItems, categories, allItems, totalCountResponse] = await Promise.all([
    getPropsPage({ ...query, sort }),
    directus.request<Category[]>(
      readItems("categories", {
        fields: ["id", "name", "slug", { parent: ["id", "slug"] }],
        limit: -1,
      })
    ),
    // Every published item (lightweight) — for category counts, locations and stats
    directus.request<Prop[]>(
      readItems("props", {
        fields: [
          "id",
          { category: ["id", "slug", { parent: ["id", "slug"] }] },
          { user_created: ["id", "city", "state"] },
        ],
        filter: { status: { _eq: "published" } },
        limit: -1,
      })
    ),
    directus.request(
      readItems("props", {
        filter: buildPropFilter(query),
        aggregate: { count: "*" },
      })
    ),
  ]);

  const vendorCount = new Set(allItems.map((i) => i.user_created?.id).filter(Boolean)).size;
  const locations = [
    ...new Set(
      allItems
        .map((i) => formatLocation(i.user_created?.city, i.user_created?.state))
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  // Category links keep the current location + sort
  const keep = new URLSearchParams();
  if (loc) keep.set("loc", loc);
  if (sort) keep.set("sort", sort);
  const keepQuery = keep.toString();

  const totalCount = parseInt(totalCountResponse[0].count as string);
  const categoryTree = getCategoryTree(categories, allItems);

  // 2. Breadcrumb Hierarchy Logic
  let breadcrumbParent = undefined;
  let breadcrumbCurrent = undefined;

  const flatParents = Object.values(categoryTree);
  for (const parent of flatParents) {
    if (parent.slug === selectedSlug) {
      breadcrumbCurrent = { name: parent.name, slug: parent.slug };
      break;
    }
    const child = Object.values(parent.children).find(
      (c) => c.slug === selectedSlug
    );
    if (child) {
      breadcrumbParent = { name: parent.name, slug: parent.slug };
      breadcrumbCurrent = { name: child.name, slug: child.slug };
      break;
    }
  }

  const heading = searchQuery
    ? `Results for “${params.search}”`
    : breadcrumbCurrent?.name ?? "All inventory";

  return (
    <>
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="container-page py-8 md:py-10">
          <h1 className="max-w-2xl text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
            Props and set dressing for film, TV and photo.
          </h1>
          <p className="mt-2 max-w-2xl text-neutral-600">
            Rent directly from independent vendors across the Hudson Valley
            and New York City.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <p className="text-neutral-700">
              <span className="font-semibold tabular-nums">{allItems.length.toLocaleString()}</span>{" "}
              items ·{" "}
              <span className="font-semibold tabular-nums">{vendorCount}</span>{" "}
              {vendorCount === 1 ? "vendor" : "vendors"}
            </p>
            <Link href="/vendors" className="link">
              Browse vendors
            </Link>
            <Link href="/how-it-works" className="link">
              How it works
            </Link>
          </div>
        </div>
      </section>

      <div className="container-page">
        <div className="flex flex-col lg:flex-row lg:gap-10">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-8">
              <CategorySidebar
                tree={categoryTree}
                selectedSlug={selectedSlug}
                keepQuery={keepQuery}
                vendorCount={vendorCount}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1 py-6 lg:py-8">
            <div className="mb-4 lg:hidden">
              <MobileCategoryBar tree={categoryTree} selectedSlug={selectedSlug} keepQuery={keepQuery} />
            </div>

            <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-neutral-200 pb-4">
              <div className="min-w-0">
                <Breadcrumbs
                  parent={breadcrumbParent}
                  current={breadcrumbCurrent}
                  search={searchQuery}
                />
                <h2 className="mt-1 truncate text-lg font-semibold tracking-tight">
                  {heading}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="text-sm text-neutral-500">
                  {totalCount.toLocaleString()} {totalCount === 1 ? "item" : "items"}
                </p>
                <Suspense fallback={<div className="h-9 w-48 rounded-md bg-neutral-100" />}>
                  <BrowseControls locations={locations} />
                </Suspense>
              </div>
            </div>

            {initialItems.length > 0 ? (
              <PropFeed
                key={`${selectedSlug}-${searchQuery}-${loc}-${sort}`}
                initialItems={initialItems}
                category={selectedSlug}
                search={searchQuery}
                loc={loc}
                sort={sort}
                totalCount={totalCount}
              />
            ) : (
              <div className="card flex flex-col items-center px-6 py-16 text-center">
                <h3 className="text-base font-semibold">No items found</h3>
                <p className="mt-1 max-w-sm text-sm text-neutral-600">
                  {searchQuery ? (
                    <>
                      Nothing matches &ldquo;{params.search}&rdquo;
                      {breadcrumbCurrent && <> in {breadcrumbCurrent.name}</>}.
                      Try a broader term.
                    </>
                  ) : (
                    <>
                      There&apos;s nothing listed in{" "}
                      {breadcrumbCurrent?.name ?? "this category"}
                      {loc && <> from {loc}</>} yet.
                    </>
                  )}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {selectedSlug && searchQuery && (
                    <Link
                      href={`/?search=${encodeURIComponent(params.search ?? "")}`}
                      className="btn-secondary"
                    >
                      Search all categories
                    </Link>
                  )}
                  <Link href="/" className="btn-primary">
                    Clear filters
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
