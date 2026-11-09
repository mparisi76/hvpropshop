import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/currentUser";
import { getVendorFootprint, isVendorAccount } from "@/lib/vendorDeletion";
import DeleteVendorForm from "./DeleteVendorForm";

export default async function DeleteVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const footprint = await getVendorFootprint(id).catch(() => null);
  if (!footprint) notFound();

  const me = await getCurrentUser();
  const { counts, blockers, user } = footprint;
  const refusal =
    me?.id === id
      ? "You can't delete your own account here."
      : !isVendorAccount(footprint)
        ? `This account's role is "${user.role ?? "none"}". Only vendor accounts can be deleted here.`
        : null;

  const items = [
    ["Account and login", user.email ?? ""],
    ["Listings", String(counts.listings)],
    ["Photos, logo and profile picture", String(counts.photos)],
    ["Booking requests and bookings", String(counts.bookings)],
    ["Date blocks", String(counts.blocks)],
    ["Vendor applications", String(counts.applications)],
    ["Stripe connected account", user.stripe_account_id ? "Removed if its balance is zero" : "None"],
  ];

  return (
    <div className="max-w-2xl">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-neutral-500">
        <Link href="/admin/vendors" className="hover:text-neutral-900">Vendors</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="text-neutral-900">Delete</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight">Delete {user.name}</h1>
      <p className="mt-1 text-sm text-neutral-600">
        This permanently removes the vendor and everything below. It can&apos;t be undone. Payment, refund and payout
        history stays in your Stripe dashboard.
      </p>

      <dl className="card mt-6 divide-y divide-neutral-200 text-sm">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
            <dt className="text-neutral-600">{label}</dt>
            <dd className="text-right font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6">
        {refusal ? (
          <p className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">{refusal}</p>
        ) : blockers.length ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="flex items-center gap-2 font-medium text-amber-900">
              <AlertTriangle className="h-4 w-4" aria-hidden /> Resolve these first
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-amber-900">
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <Link href="/admin/bookings?tab=all" className="btn-secondary mt-3 h-9!">Go to Bookings</Link>
          </div>
        ) : (
          <DeleteVendorForm vendorId={id} name={user.name} />
        )}
      </div>
    </div>
  );
}
