import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BrowseView from "@/components/browse/BrowseView";
import JsonLd from "@/components/JsonLd";
import VendorAvatar from "@/components/VendorAvatar";
import { getCatalog } from "@/lib/catalog";
import { getVendorsCached, vendorLocation, vendorName } from "@/lib/vendors";
import { locationPath, locationSlug } from "@/lib/browse";
import { absoluteUrl, pageMeta } from "@/lib/seo";

type Params = Promise<{ place: string }>;
type SearchParams = Promise<{ search?: string; sort?: string }>;

async function findPlace(place: string) {
  const { locations } = await getCatalog();
  return locations.find((l) => l.slug === place) ?? null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const [{ place }, { search, sort }] = await Promise.all([params, searchParams]);
  const loc = await findPlace(place);
  if (!loc) return { title: "Location not found | HV Prop Shop", robots: { index: false } };

  return pageMeta({
    title: `Prop rentals in ${loc.label} — props & set dressing for film & TV | HV Prop Shop`,
    description: `Rent props and set dressing for pickup in ${loc.label}: ${loc.itemCount} ${
      loc.itemCount === 1 ? "item" : "items"
    } from ${loc.vendorIds.length} local ${loc.vendorIds.length === 1 ? "vendor" : "vendors"}, for film, TV and photo production.`,
    path: locationPath(loc.label),
    noindex: Boolean(search || sort),
  });
}

export default async function LocationPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const [{ place }, query] = await Promise.all([params, searchParams]);
  const loc = await findPlace(place);
  if (!loc) notFound();

  const vendors = (await getVendorsCached().catch(() => [])).filter((v) => locationSlug(vendorLocation(v)) === loc.slug);

  return (
    <BrowseView
      loc={loc.label}
      search={query.search}
      sort={query.sort}
      locationPage
      hero={
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Prop rentals by town", item: absoluteUrl("/prop-rentals") },
                { "@type": "ListItem", position: 2, name: loc.label, item: absoluteUrl(locationPath(loc.label)) },
              ],
            }}
          />
          <section className="border-b border-neutral-200 bg-neutral-50">
            <div className="container-page py-8 md:py-10">
              <Link href="/prop-rentals" className="eyebrow hover:text-neutral-900">
                Prop rentals by town
              </Link>
              <h1 className="mt-1 max-w-2xl text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
                Prop rentals in {loc.label}
              </h1>
              <p className="mt-2 max-w-2xl text-neutral-600">
                {loc.itemCount.toLocaleString()} {loc.itemCount === 1 ? "item" : "items"} available for pickup in{" "}
                {loc.label} from {loc.vendorIds.length} independent{" "}
                {loc.vendorIds.length === 1 ? "vendor" : "vendors"}. Request dates online and the vendor confirms before
                you pay.
              </p>

              {vendors.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {vendors.map((v) => (
                    <Link
                      key={v.id}
                      href={`/vendors/${v.id}`}
                      className="flex items-center gap-2 rounded-md border border-neutral-200 bg-white py-1 pl-1 pr-3 text-sm transition-colors hover:border-neutral-400"
                    >
                      <VendorAvatar name={vendorName(v)} logo={v.shop_logo} size="sm" />
                      <span className="font-medium">{vendorName(v)}</span>
                      <span className="text-xs text-neutral-500">{v.itemCount}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      }
    />
  );
}
