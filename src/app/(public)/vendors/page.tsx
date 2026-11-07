import Link from "next/link";
import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import VendorAvatar from "@/components/VendorAvatar";
import FeaturedBadge from "@/components/FeaturedBadge";
import {
  formatInventoryType,
  getInventoryTypeField,
  getVendors,
  vendorLocation,
  vendorName,
} from "@/lib/vendors";

export const metadata: Metadata = {
  title: "Vendors | HV Prop Shop",
  description:
    "Prop houses and independent vendors across the Hudson Valley and New York City.",
};

export default async function VendorsPage() {
  const [vendors, inventoryField] = await Promise.all([
    getVendors(),
    getInventoryTypeField(),
  ]);

  return (
    <>
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="container-page py-8 md:py-10">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Vendors</h1>
          <p className="mt-2 max-w-2xl text-neutral-600">
            Prop houses and independent vendors renting to productions from the
            Hudson Valley to New York City.
          </p>
        </div>
      </section>

      <div className="container-page py-8">
        <p className="mb-4 text-sm text-neutral-500">
          {vendors.length} {vendors.length === 1 ? "vendor" : "vendors"}
        </p>

        {vendors.length === 0 ? (
          <div className="card px-6 py-16 text-center text-sm text-neutral-600">
            No vendors to show yet.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v) => {
              const name = vendorName(v);
              const location = vendorLocation(v);
              const specialties = formatInventoryType(v.inventory_type, inventoryField?.choices);
              return (
                <li key={v.id}>
                  <Link
                    href={`/vendors/${v.id}`}
                    className="card flex h-full gap-4 p-4 transition-colors hover:border-neutral-400"
                  >
                    <VendorAvatar name={name} logo={v.shop_logo} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-medium">{name}</p>
                        {v.featured_vendor && <FeaturedBadge />}
                      </div>
                      {location && (
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-neutral-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {location}
                        </p>
                      )}
                      {specialties && (
                        <p className="mt-2 line-clamp-2 text-sm text-neutral-700">{specialties}</p>
                      )}
                      <p className="mt-2 text-xs text-neutral-500">
                        {v.itemCount} {v.itemCount === 1 ? "item" : "items"} listed
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
