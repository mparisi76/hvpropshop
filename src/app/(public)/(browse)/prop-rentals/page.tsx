import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getCatalog } from "@/lib/catalog";
import { locationPath } from "@/lib/browse";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Prop rentals by town — Hudson Valley to NYC | HV Prop Shop",
  description:
    "Find props and set dressing to rent near your set. Browse vendors and inventory by pickup town across the Hudson Valley and New York City.",
  path: "/prop-rentals",
});

export default async function LocationsIndex() {
  const { locations } = await getCatalog();

  // Group towns by state
  const byState = new Map<string, typeof locations>();
  for (const l of locations) {
    const state = l.label.split(", ").pop() ?? "";
    byState.set(state, [...(byState.get(state) ?? []), l]);
  }

  return (
    <>
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="container-page py-8 md:py-10">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Prop rentals by town</h1>
          <p className="mt-2 max-w-2xl text-neutral-600">
            Pick up close to set. Browse props and set dressing by where the vendor is based.
          </p>
        </div>
      </section>

      <div className="container-page space-y-8 py-8">
        {locations.length === 0 ? (
          <p className="text-sm text-neutral-500">No locations yet.</p>
        ) : (
          [...byState.entries()].map(([state, towns]) => (
            <section key={state}>
              {byState.size > 1 && <h2 className="mb-3 text-sm font-semibold text-neutral-700">{state}</h2>}
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {towns.map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={locationPath(l.label)}
                      className="card flex items-center justify-between gap-3 p-4 transition-colors hover:border-neutral-400"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <MapPin className="h-4 w-4 text-neutral-400" aria-hidden /> {l.label}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {l.itemCount} {l.itemCount === 1 ? "item" : "items"} · {l.vendorIds.length}{" "}
                        {l.vendorIds.length === 1 ? "vendor" : "vendors"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </>
  );
}
