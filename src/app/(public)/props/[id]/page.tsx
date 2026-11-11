import { readItem, readItems } from "@directus/sdk";
import directus from "@/lib/directus";
import Gallery from "@/components/Gallery";
import Link from "next/link";
import PropCard from "@/components/PropCard";
import { getLiveAvailability, type Rental } from "@/lib/utils";
import { asServer } from "@/lib/serverDirectus";
import { GalleryItem, Prop } from "@/types";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import type { Metadata } from "next";
import { absoluteUrl, pageMeta, plainText, previewImage } from "@/lib/seo";
import { categoryPath, locationPath } from "@/lib/browse";
import InquiryWrapper from "@/components/inquiry/InquiryWrapper";
import PullListButton from "@/components/PullListButton";
import { CARD_FIELDS } from "@/lib/props";
import { isItemUnavailable, withOptionalField } from "@/lib/fields";
import RequestButton from "@/components/request/RequestButton";
import ItemAlertForm from "@/components/ItemAlertForm";
import VendorAvatar from "@/components/VendorAvatar";
import { ChevronRight } from "lucide-react";
import { vendorName as getVendorName } from "@/lib/vendors";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = (await directus
    .request(
      readItem("props", id, {
        fields: [
          "name",
          "description",
          "thumbnail",
          "price",
          { category: ["name"] },
          { user_created: ["shop_name", "first_name", "city", "state"] },
        ],
      })
    )
    .catch(() => null)) as {
    name: string;
    description: string | null;
    thumbnail: string | null;
    price: number | null;
    category: { name: string } | null;
    user_created: { shop_name: string | null; first_name: string | null; city: string | null; state: string | null } | null;
  } | null;

  if (!item) return { title: "Item not found | HV Prop Shop", robots: { index: false } };

  const place = [item.user_created?.city, item.user_created?.state].filter(Boolean).join(", ");
  const vendor = item.user_created?.shop_name || item.user_created?.first_name;
  const fallback = [
    `Rent ${item.name}${item.category?.name ? ` (${item.category.name.toLowerCase()})` : ""} for film, TV and photo production`,
    item.price ? `$${item.price}/day` : null,
    vendor ? `from ${vendor}${place ? ` in ${place}` : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return pageMeta({
    title: `${item.name} — prop rental${place ? ` in ${place}` : ""} | HV Prop Shop`,
    description: plainText(item.description) || fallback,
    path: `/props/${id}`,
    image: item.thumbnail ? previewImage(item.thumbnail) : null,
    imageAlt: item.name,
  });
}

export default async function PropDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // shop_logo is optional: if it isn't publicly readable, load the item without it
  const loadItem = (vendorFields: string[]) =>
    directus.request<Prop>(
    readItem("props", id, {
      fields: [
        "*",
        "thumbnail",
        {
          category: [
            "id",
            "name",
            "slug",
            {
              parent: ["name", "slug"],
            },
          ],
        },
        {
          photo_gallery: ["directus_files_id"],
        },
        {
          user_created: vendorFields,
        },
        "dimensions",
        "quantity_available",
        "condition",
        "availability",
      ],
    })
  );
  const vendorFields = ["id", "first_name", "last_name", "shop_name", "city", "state"];
  // Old or unpublished links (e.g. from search engines) are a normal 404, not an error
  const item = await withOptionalField(
    "shop_logo",
    () => loadItem([...vendorFields, "shop_logo"]),
    () => loadItem(vendorFields)
  ).catch((error) => {
    if (isItemUnavailable(error)) return null;
    throw error;
  });

  if (!item) notFound();

  // 1. STOCK LOGIC — rentals (bookings + vendor blocks) are private, so read
  // only dates/quantities with the server token
  const rentals = await asServer(
    readItems("rentals", {
      fields: ["status", "start_date", "end_date", "quantity"],
      filter: { _and: [{ prop_id: { _eq: item.id } }, { status: { _eq: "confirmed" } }] },
      limit: -1,
    })
  ).catch((error) => {
    console.error("Rental lookup failed:", error);
    return [];
  });
  const liveQuantity = getLiveAvailability(item.quantity_available, rentals as Rental[]);

  const displayAvailability = item.availability || "available";
  const isSold = displayAvailability === "sold";
  const isOutOfStock = liveQuantity <= 0 || isSold;

  // "More from this shop" and "More in {category}" — published only, excluding this item
  const shopId = item.user_created?.id;
  const categoryId = item.category?.id;
  const [shopItems, categoryItems] = await Promise.all([
    shopId
      ? directus.request<Prop[]>(
          readItems("props", {
            fields: [...CARD_FIELDS],
            filter: {
              _and: [
                { status: { _eq: "published" } },
                { user_created: { _eq: shopId } },
                { id: { _neq: item.id } },
              ],
            },
            sort: ["-date_created"],
            limit: 4,
          })
        )
      : Promise.resolve([] as Prop[]),
    categoryId
      ? directus.request<Prop[]>(
          readItems("props", {
            fields: [...CARD_FIELDS],
            filter: {
              _and: [
                { status: { _eq: "published" } },
                { category: { id: { _eq: categoryId } } },
                { id: { _neq: item.id } },
              ],
            },
            limit: 8,
          })
        )
      : Promise.resolve([] as Prop[]),
  ]);
  // Prefer category items not already shown in the shop section, but fill the
  // row with repeats rather than hide the section (common with few vendors).
  const shopItemIds = new Set(shopItems.map((i) => String(i.id)));
  const relatedItems = [
    ...categoryItems.filter((i) => !shopItemIds.has(String(i.id))),
    ...categoryItems.filter((i) => shopItemIds.has(String(i.id))),
  ].slice(0, 4);

  const galleryIds =
    item.photo_gallery?.map((g: GalleryItem) => g.directus_files_id) || [];
  const allImageIds = Array.from(
    new Set([item.thumbnail, ...galleryIds])
  ).filter(Boolean);

  const vendorName = getVendorName(item.user_created);
  const vendorId = item.user_created?.id;
  const vendorLocation =
    item.user_created?.city && item.user_created?.state
      ? `${item.user_created.city}, ${item.user_created.state}`
      : "Hudson Valley, NY";

  const specs: { label: string; value: React.ReactNode }[] = [
    { label: "Category", value: item.category?.name ?? "—" },
    { label: "Condition", value: item.condition || "Production ready" },
    {
      label: "Available now",
      value: isOutOfStock ? "None" : `${liveQuantity} ${liveQuantity === 1 ? "unit" : "units"}`,
    },
    ...(item.dimensions ? [{ label: "Dimensions", value: item.dimensions }] : []),
    {
      label: "Pickup location",
      value:
        item.user_created?.city && item.user_created?.state ? (
          <Link href={locationPath(vendorLocation)} className="underline-offset-2 hover:underline">
            {vendorLocation}
          </Link>
        ) : (
          vendorLocation
        ),
    },
  ];

  const price = item.price != null ? `$${item.price.toLocaleString()}` : null;

  // Structured data: the item as a rentable product (daily rate) + its breadcrumb trail
  const itemUrl = absoluteUrl(`/props/${item.id}`);
  const crumbs = [
    { name: "All inventory", url: absoluteUrl("/") },
    ...(item.category?.parent
      ? [{ name: item.category.parent.name, url: absoluteUrl(categoryPath(item.category.parent.slug)) }]
      : []),
    ...(item.category ? [{ name: item.category.name, url: absoluteUrl(categoryPath(item.category.slug)) }] : []),
    { name: item.name, url: itemUrl },
  ];
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: item.name,
      url: itemUrl,
      description: plainText(item.description, 500) || undefined,
      image: allImageIds.slice(0, 5).map((fileId) => previewImage(String(fileId))),
      category: item.category?.name,
      ...(item.condition ? { itemCondition: "https://schema.org/UsedCondition" } : {}),
      ...(item.price != null
        ? {
            offers: {
              "@type": "Offer",
              url: itemUrl,
              priceCurrency: "USD",
              price: item.price,
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: item.price,
                priceCurrency: "USD",
                unitCode: "DAY",
                unitText: "per day",
              },
              availability: isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              seller: {
                "@type": "Organization",
                name: vendorName,
                ...(vendorId ? { url: absoluteUrl(`/vendors/${vendorId}`) } : {}),
              },
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
    },
  ];

  return (
    <div className="container-page pb-28 pt-6 lg:pb-16">
      <JsonLd data={structuredData} />
      {item.category && (
        <div className="mb-6">
          <Breadcrumbs
            parent={
              item.category.parent
                ? { name: item.category.parent.name, slug: item.category.parent.slug }
                : undefined
            }
            current={{ name: item.category.name, slug: item.category.slug }}
            linkCurrent
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        {/* LEFT: gallery + description */}
        <div className="space-y-10 lg:col-span-7">
          {allImageIds.length > 0 ? (
            <Gallery images={allImageIds} alt={item.name} />
          ) : (
            <div className="grid aspect-4/3 w-full place-items-center rounded-md border border-neutral-200 bg-neutral-100 text-sm text-neutral-400">
              No photos provided
            </div>
          )}

          <section className="hidden lg:block">
            <h2 className="mb-3 text-base font-semibold">Description</h2>
            <div
              className="space-y-3 text-[15px] leading-relaxed text-neutral-700 [&_a]:underline"
              dangerouslySetInnerHTML={{
                __html: item.description || "<p>No description provided.</p>",
              }}
            />
          </section>
        </div>

        {/* RIGHT: summary */}
        <aside className="lg:col-span-5">
          <div className="space-y-6 lg:sticky lg:top-24">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-3xl">
                  {item.name}
                </h1>
                <AvailabilityBadge
                  available={!isOutOfStock}
                  label={isOutOfStock ? "Unavailable" : displayAvailability}
                />
              </div>
              {price && (
                <p className="mt-2 text-xl tabular-nums text-neutral-900">
                  {price}
                  <span className="text-base text-neutral-500"> / day</span>
                </p>
              )}
              {!isOutOfStock && liveQuantity > 0 && liveQuantity < 3 && (
                <p className="mt-1 text-sm text-amber-700">
                  Only {liveQuantity} left
                </p>
              )}
              <p className="mt-3 text-sm text-neutral-600">
                Paying by PO or need to send a COI?{" "}
                <RequestButton
                  type="quote"
                  itemIds={[String(item.id)]}
                  maxQuantity={item.quantity_available}
                  className="link font-medium"
                  label="Request a quote"
                  summary={
                    <>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-neutral-500">
                        {vendorName}
                        {price && <> · {price}/day</>}
                      </p>
                    </>
                  }
                />
              </p>
            </div>

            {/* Out on a job (not sold): offer an email when it's free again (phones and desktop) */}
            {isOutOfStock && !isSold && <ItemAlertForm propId={String(item.id)} />}

            <div className="hidden space-y-2 lg:block">
              {isOutOfStock ? (
                <div className="space-y-3">
                  {isSold && (
                    <p className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                      This item has been sold and is no longer available.
                    </p>
                  )}
                  <Link href={item.category ? categoryPath(item.category.slug) : "/"} className="btn-secondary w-full">
                    Browse similar items
                  </Link>
                </div>
              ) : (
                <InquiryWrapper item={item} />
              )}
              <PullListButton id={item.id} />
            </div>

            <dl className="divide-y divide-neutral-200 border-y border-neutral-200 text-sm">
              {specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-neutral-500">{s.label}</dt>
                  <dd className="text-right font-medium capitalize text-neutral-900">{s.value}</dd>
                </div>
              ))}
            </dl>

            {(() => {
              const inner = (
                <>
                  <VendorAvatar name={vendorName} logo={item.user_created?.shop_logo} />
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow">Listed by</p>
                    <p className="truncate text-sm font-medium">{vendorName}</p>
                    <p className="truncate text-xs text-neutral-500">{vendorLocation}</p>
                  </div>
                </>
              );
              return vendorId ? (
                <Link
                  href={`/vendors/${vendorId}`}
                  className="card flex items-center gap-3 p-4 transition-colors hover:border-neutral-400"
                >
                  {inner}
                  <span className="flex shrink-0 items-center gap-0.5 text-sm text-neutral-600">
                    View shop <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              ) : (
                <div className="card flex items-center gap-3 p-4">{inner}</div>
              );
            })()}

            <section className="lg:hidden">
              <h2 className="mb-3 text-base font-semibold">Description</h2>
              <div
                className="space-y-3 text-[15px] leading-relaxed text-neutral-700 [&_a]:underline"
                dangerouslySetInnerHTML={{
                  __html: item.description || "<p>No description provided.</p>",
                }}
              />
            </section>
          </div>
        </aside>
      </div>

      {/* MORE FROM THIS SHOP */}
      {shopItems.length > 0 && (
        <section className="mt-16 border-t border-neutral-200 pt-8">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="min-w-0 truncate text-lg font-semibold tracking-tight">
              More from {vendorName}
            </h2>
            <Link href={`/vendors/${shopId}`} className="link shrink-0 text-sm">
              View shop
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {shopItems.map((shopItem) => (
              <PropCard key={shopItem.id} item={shopItem} />
            ))}
          </div>
        </section>
      )}

      {/* MORE IN CATEGORY */}
      {relatedItems.length > 0 && (
        <section className={`${shopItems.length > 0 ? "mt-12" : "mt-16"} border-t border-neutral-200 pt-8`}>
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              More in {item.category?.name ?? "this category"}
            </h2>
            <Link href={item.category ? categoryPath(item.category.slug) : "/"} className="link text-sm">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {relatedItems.map((related) => (
              <PropCard key={related.id} item={related} />
            ))}
          </div>
        </section>
      )}

      {/* MOBILE ACTION BAR */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            {price && (
              <p className="text-base font-semibold tabular-nums">
                {price}
                <span className="text-sm font-normal text-neutral-500"> / day</span>
              </p>
            )}
            <p className="text-xs text-neutral-500">{vendorName}</p>
          </div>
          <div className="flex items-center gap-2">
            <PullListButton id={item.id} variant="square" />
            <div className="w-44">
              {isOutOfStock ? (
                <button disabled className="btn-secondary w-full">
                  Unavailable
                </button>
              ) : (
                <InquiryWrapper item={item} compact />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AvailabilityBadge({ available, label }: { available: boolean; label: string }) {
  return (
    <span
      className={`mt-1.5 inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium capitalize ${
        available ? "bg-accent-soft text-accent" : "bg-neutral-100 text-neutral-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${available ? "bg-accent" : "bg-neutral-400"}`}
        aria-hidden
      />
      {label}
    </span>
  );
}
