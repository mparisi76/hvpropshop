import Link from "next/link";
import { Suspense } from "react";
import PropFeed from "@/components/PropFeed";
import Breadcrumbs from "@/components/Breadcrumbs";
import BrowseControls from "@/components/BrowseControls";
import TrackEvent from "@/components/TrackEvent";
import { getBrowseResults } from "@/lib/props";
import { findCategory, getCatalog } from "@/lib/catalog";

/**
 * The results column of a browse page: breadcrumbs, title, intro, location/sort
 * controls and the item grid. The category sidebar lives in the (browse) layout
 * so it stays put while this column changes.
 */
export default async function BrowseView({
  category,
  search,
  loc,
  sort,
  locationPage = false,
  near,
  radius,
  title,
  intro,
  extra,
  eyebrow,
}: {
  category?: string;
  search?: string;
  /** "City, ST" */
  loc?: string;
  sort?: string;
  /** On a /prop-rentals page the location is part of the URL, not a filter */
  locationPage?: boolean;
  /** Distance search: town, ZIP or "lat,lng" */
  near?: string;
  radius?: number;
  title: string;
  intro?: React.ReactNode;
  /** Shown under the intro (e.g. stats, local vendors) */
  extra?: React.ReactNode;
  /** Small link above the title when there are no category breadcrumbs */
  eyebrow?: React.ReactNode;
}) {
  const catalog = await getCatalog();
  const found = findCategory(catalog.tree, category);
  const query = {
    category,
    categoryIds: found?.ids ?? null,
    search: search?.toLowerCase(),
    loc: near ? undefined : loc, // a distance search replaces the town filter
    near: near || undefined,
    radius,
  };
  const results = await getBrowseResults({ ...query, sort });
  const { items: initialItems, total: totalCount } = results;
  const nearFound = results.near && "label" in results.near ? results.near : null;
  const nearMissing = results.near && "notFound" in results.near ? results.near.query : null;

  return (
    <>
      {search && (
        <TrackEvent
          name="Search"
          eventKey={`${search}|${category ?? ""}|${loc ?? ""}`}
          props={{ query: search.toLowerCase(), results: totalCount, zero: totalCount === 0, category, location: loc }}
        />
      )}
      <div className="mb-6 border-b border-neutral-200 pb-5">
        {found ? <Breadcrumbs parent={found.parent} current={found.current} /> : eyebrow}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
          {search
            ? `Results for “${search}”`
            : nearFound
              ? `${found ? `${found.current.name} within` : "Within"} ${nearFound.radius} mi of ${nearFound.label}`
              : title}
        </h1>
        {intro && !search && !near && <div className="mt-2 max-w-2xl text-neutral-600">{intro}</div>}
        {extra && !search && !near && <div className="mt-4">{extra}</div>}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-sm text-neutral-500">
            {totalCount.toLocaleString()} {totalCount === 1 ? "item" : "items"}
          </p>
          <Suspense fallback={<div className="h-9 w-48 rounded-md bg-neutral-100" />}>
            <BrowseControls
              locations={catalog.locations.map((l) => l.label)}
              currentLocation={locationPage ? loc : undefined}
              nearLabel={nearFound?.label}
            />
          </Suspense>
        </div>
      </div>

      {initialItems.length > 0 ? (
        <PropFeed
          key={`${category}-${search}-${loc}-${sort}-${near}-${radius}`}
          initialItems={initialItems}
          category={category}
          search={query.search}
          loc={query.loc}
          sort={sort}
          near={query.near}
          radius={radius}
          totalCount={totalCount}
        />
      ) : (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <h2 className="text-base font-semibold">{nearMissing ? "Location not found" : "No items found"}</h2>
          <p className="mt-1 max-w-sm text-sm text-neutral-600">
            {nearMissing ? (
              <>We couldn&apos;t find &ldquo;{nearMissing}&rdquo;. Try a town name, &ldquo;Town, NY&rdquo; or a 5-digit ZIP.</>
            ) : nearFound ? (
              <>
                Nothing{found && <> in {found.current.name}</>} within {nearFound.radius} miles of {nearFound.label} yet.
                Try a bigger distance.
              </>
            ) : search ? (
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
    </>
  );
}
