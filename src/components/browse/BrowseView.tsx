import Link from "next/link";
import { Suspense } from "react";
import CategorySidebar from "@/components/CategorySidebar";
import MobileCategoryBar from "@/components/MobileCategoryBar";
import PropFeed from "@/components/PropFeed";
import Breadcrumbs from "@/components/Breadcrumbs";
import BrowseControls from "@/components/BrowseControls";
import { getBrowseResults } from "@/lib/props";
import { findCategory, getCatalog } from "@/lib/catalog";

/**
 * The inventory browser: category sidebar, results header with location/sort
 * controls, and the item grid. Used by the homepage, /rentals/[category] and
 * /prop-rentals/[place]; each passes its own header section as `hero`.
 */
export default async function BrowseView({
  category,
  search,
  loc,
  sort,
  hero,
  locationPage = false,
}: {
  category?: string;
  search?: string;
  /** "City, ST" */
  loc?: string;
  sort?: string;
  hero: React.ReactNode;
  /** On a /prop-rentals page the location is part of the URL, not a filter */
  locationPage?: boolean;
}) {
  const catalog = await getCatalog();
  const found = findCategory(catalog.tree, category);
  const query = { category, categoryIds: found?.ids ?? null, search: search?.toLowerCase(), loc };

  const { items: initialItems, total: totalCount } = await getBrowseResults({ ...query, sort });

  // Category links keep the location (unless it's in the path) and sort
  const keep = new URLSearchParams();
  if (loc && !locationPage) keep.set("loc", loc);
  if (sort) keep.set("sort", sort);
  const keepQuery = keep.toString();

  const heading = search
    ? `Results for “${search}”`
    : found?.current.name ?? (loc ? `Available in ${loc}` : "All inventory");

  return (
    <>
      {hero}

      <div className="container-page">
        <div className="flex flex-col lg:flex-row lg:gap-10">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-8">
              <CategorySidebar
                tree={catalog.tree}
                selectedSlug={category}
                keepQuery={keepQuery}
                vendorCount={catalog.vendorCount}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1 py-6 lg:py-8">
            <div className="mb-4 lg:hidden">
              <MobileCategoryBar tree={catalog.tree} selectedSlug={category} keepQuery={keepQuery} />
            </div>

            <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-neutral-200 pb-4">
              <div className="min-w-0">
                <Breadcrumbs parent={found?.parent} current={found?.current} search={search} />
                <h2 className="mt-1 truncate text-lg font-semibold tracking-tight">{heading}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="text-sm text-neutral-500">
                  {totalCount.toLocaleString()} {totalCount === 1 ? "item" : "items"}
                </p>
                <Suspense fallback={<div className="h-9 w-48 rounded-md bg-neutral-100" />}>
                  <BrowseControls
                    locations={catalog.locations.map((l) => l.label)}
                    currentLocation={locationPage ? loc : undefined}
                  />
                </Suspense>
              </div>
            </div>

            {initialItems.length > 0 ? (
              <PropFeed
                key={`${category}-${search}-${loc}-${sort}`}
                initialItems={initialItems}
                category={category}
                search={query.search}
                loc={loc}
                sort={sort}
                totalCount={totalCount}
              />
            ) : (
              <div className="card flex flex-col items-center px-6 py-16 text-center">
                <h3 className="text-base font-semibold">No items found</h3>
                <p className="mt-1 max-w-sm text-sm text-neutral-600">
                  {search ? (
                    <>
                      Nothing matches &ldquo;{search}&rdquo;{found && <> in {found.current.name}</>}. Try a broader term.
                    </>
                  ) : (
                    <>
                      There&apos;s nothing listed in {found?.current.name ?? "this category"}
                      {loc && <> from {loc}</>} yet.
                    </>
                  )}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {category && search && (
                    <Link href={`/?search=${encodeURIComponent(search)}`} className="btn-secondary">
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
