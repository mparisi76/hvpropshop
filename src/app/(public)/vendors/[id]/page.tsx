import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readItems } from "@directus/sdk";
import { ChevronRight, ExternalLink, Mail, MapPin } from "lucide-react";
import directus from "@/lib/directus";
import { Prop } from "@/types";
import { CONTACT_EMAIL } from "@/lib/site";
import PropFeed from "@/components/PropFeed";
import JsonLd from "@/components/JsonLd";
import { getCatalog } from "@/lib/catalog";
import { categoryPath } from "@/lib/browse";
import { absoluteUrl, pageMeta, previewImage } from "@/lib/seo";
import VendorAvatar from "@/components/VendorAvatar";
import FeaturedBadge from "@/components/FeaturedBadge";
import {
  getVendor,
  VENDOR_CARD_FIELDS,
  vendorLocation,
  vendorName,
  vendorWebsite,
} from "@/lib/vendors";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const vendor = await getVendor(id);
  if (!vendor) return { title: "Vendor not found | HV Prop Shop" };

  const name = vendorName(vendor);
  const location = vendorLocation(vendor);
  return pageMeta({
    title: `${name}${location ? ` — prop rentals in ${location}` : ""} | HV Prop Shop`,
    description: `Rent props and set dressing from ${name}${location ? ` in ${location}` : ""}. ${vendor.itemCount} ${
      vendor.itemCount === 1 ? "item" : "items"
    } available for film, TV and photo production.`,
    path: `/vendors/${id}`,
    image: vendor.shop_logo ? previewImage(vendor.shop_logo, "inside") : null,
    imageAlt: name,
  });
}

export default async function VendorPage({ params }: Params) {
  const { id } = await params;
  const vendor = await getVendor(id);
  if (!vendor) notFound();

  const catalogPromise = getCatalog();
  const items = await directus.request<Prop[]>(
    readItems("props", {
      fields: [
        "id",
        "name",
        "price",
        "thumbnail",
        "availability",
        { category: ["id", "name", "slug", { parent: ["id", "name", "slug"] }] },
        { user_created: [...VENDOR_CARD_FIELDS] },
      ],
      filter: {
        _and: [{ status: { _eq: "published" } }, { user_created: { _eq: id } }],
      },
      limit: 12,
      sort: ["-date_created"],
    })
  );

  const name = vendorName(vendor);
  const location = vendorLocation(vendor);
  const categories = (await catalogPromise).vendorCategories[id] ?? [];
  const about = vendor.inventory?.trim() || null;
  const website = vendorWebsite(vendor.website);
  const contactHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    `Inquiry about ${name}`
  )}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Store",
    name,
    url: absoluteUrl(`/vendors/${id}`),
    description:
      about ??
      (categories.length
        ? `Prop and set dressing rentals: ${categories.map((c) => c.name).join(", ")}`
        : "Prop and set dressing rentals"),
    ...(vendor.shop_logo ? { logo: previewImage(vendor.shop_logo, "inside"), image: previewImage(vendor.shop_logo, "inside") } : {}),
    ...(vendor.city || vendor.state
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: vendor.city ?? undefined,
            addressRegion: vendor.state ?? undefined,
            addressCountry: "US",
          },
        }
      : {}),
    ...(website ? { sameAs: [website.href] } : {}),
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="container-page py-8">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-neutral-500">
            <Link href="/vendors" className="hover:text-neutral-900">
              Vendors
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            <span className="truncate text-neutral-900">{name}</span>
          </nav>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 gap-4">
              <VendorAvatar name={name} logo={vendor.shop_logo} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{name}</h1>
                  {vendor.featured_vendor && <FeaturedBadge />}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
                  {location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden /> {location}
                    </span>
                  )}
                  <span>
                    {vendor.itemCount} {vendor.itemCount === 1 ? "item" : "items"} listed
                  </span>
                </div>
                {about && <p className="mt-3 max-w-2xl whitespace-pre-line text-sm text-neutral-700">{about}</p>}
                {categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <Link
                        key={c.slug}
                        href={categoryPath(c.slug)}
                        className="rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-700 hover:border-neutral-400"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {website && (
                <a
                  href={website.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  title={website.label}
                >
                  <ExternalLink className="h-4 w-4" /> Website
                </a>
              )}
              <a href={contactHref} className="btn-primary">
                <Mail className="h-4 w-4" /> Contact
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-8">
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-neutral-200 pb-4">
          <h2 className="text-lg font-semibold tracking-tight">Inventory</h2>
          <p className="text-sm text-neutral-500">
            {vendor.itemCount.toLocaleString()} {vendor.itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <PropFeed initialItems={items} vendor={id} totalCount={vendor.itemCount} />
      </div>
    </>
  );
}
