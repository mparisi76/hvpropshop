/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, ChevronRight, Clock, Mail, Phone, XCircle } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { getCurrentUser } from "@/lib/currentUser";
import {
  BOOKING_STATUS,
  formatDate,
  formatMoney,
  getAvailableUnits,
  getBooking,
  rentalDays,
} from "@/lib/bookings";
import { canCancel } from "@/lib/cancellations";
import RequestDecision from "./RequestDecision";
import PayoutsBanner from "@/components/dashboard/PayoutsBanner";
import { getPayoutAccountStatus, vendorShare, PLATFORM_FEE_RATE } from "@/lib/payouts";

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/dashboard/requests/${id}`);

  const b = await getBooking(id).catch(() => null);
  if (!b || b.prop_id?.user_created?.id !== user.id) notFound();

  const prop = b.prop_id!;
  const firstName = (b.customer_name ?? "the customer").split(" ")[0];
  const days = rentalDays(b.start_date, b.end_date);
  const isPending = b.status === BOOKING_STATUS.pending;
  const totalUnits = Number(prop.quantity_available) || 0;

  // For new requests, show what's actually free on those dates right now
  const freeUnits = isPending
    ? await getAvailableUnits(prop.id, totalUnits, b.start_date, b.end_date, b.id).catch(() => null)
    : null;

  const payouts = isPending ? await getPayoutAccountStatus(user.id) : null;

  const outcome =
    b.status === BOOKING_STATUS.accepted
      ? { icon: Clock, tone: "border-blue-200 bg-blue-50 text-blue-900", title: "Accepted, waiting for payment",
          body: `We've emailed ${firstName} a link to pay. The item is held for them until they pay or the dates pass.` }
      : b.status === BOOKING_STATUS.paid
        ? { icon: CheckCircle2, tone: "border-green-200 bg-accent-soft text-accent", title: "Booked and paid",
            body: `Reply to ${firstName} by email or phone to arrange pickup and return.` }
        : b.status === BOOKING_STATUS.declined
          ? { icon: XCircle, tone: "border-neutral-200 bg-neutral-50 text-neutral-700", title: "You declined this request",
              body: b.decline_reason ? `Your note: ${b.decline_reason}` : `${firstName} has been told it isn't available.` }
          : b.status === BOOKING_STATUS.cancelled
            ? { icon: XCircle, tone: "border-neutral-200 bg-neutral-50 text-neutral-700", title: "Cancelled",
                body: "This booking was cancelled and the dates are free again." }
            : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader />

      <main className="container-page max-w-2xl! py-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-neutral-500">
          <Link href="/dashboard/requests" className="hover:text-neutral-900">Requests</Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="truncate text-neutral-900">{b.item_name ?? prop.name}</span>
        </nav>

        <h1 className="text-2xl font-semibold tracking-tight">
          {isPending ? `${firstName} wants to book this` : "Booking request"}
        </h1>

        {payouts && !payouts.ready && <PayoutsBanner connected={payouts.connected} />}

        {outcome && (
          <div className={`mt-4 flex gap-3 rounded-md border px-4 py-3 ${outcome.tone}`}>
            <outcome.icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">{outcome.title}</p>
              <p className="text-sm opacity-90">{outcome.body}</p>
            </div>
          </div>
        )}

        {/* Item + booking details */}
        <section className="card mt-6 overflow-hidden">
          <div className="flex gap-4 border-b border-neutral-200 p-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100">
              {prop.thumbnail && (
                <img
                  src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${prop.thumbnail}?width=160&height=160&fit=cover&format=webp`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium">{b.item_name ?? prop.name}</p>
              <Link href={`/dashboard/edit/${prop.id}`} className="text-sm text-neutral-500 hover:text-neutral-900">
                View listing
              </Link>
            </div>
          </div>
          <dl className="divide-y divide-neutral-200 text-sm">
            <Row label="Pickup" value={formatDate(b.start_date)} />
            <Row label="Return" value={formatDate(b.end_date)} />
            <Row label="Length" value={`${days} ${days === 1 ? "day" : "days"}`} />
            <Row label="Quantity" value={`${b.quantity} of ${totalUnits}`} />
            <Row label="Customer pays" value={b.total != null ? formatMoney(b.total) : "—"} />
            {b.total != null && (
              <Row
                label={`You receive (after ${Math.round(PLATFORM_FEE_RATE * 100)}% commission)`}
                value={formatMoney(vendorShare(Number(b.total)))}
                strong
              />
            )}
          </dl>
          {freeUnits != null && (
            <p
              className={`border-t px-4 py-2.5 text-sm ${
                freeUnits >= b.quantity
                  ? "border-neutral-200 text-accent"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {freeUnits >= b.quantity
                ? `Available: ${freeUnits} of ${totalUnits} free on these dates.`
                : freeUnits === 0
                  ? "Not available: it's already booked or blocked for these dates."
                  : `Only ${freeUnits} free on these dates, but ${b.quantity} requested.`}
            </p>
          )}
        </section>

        {/* Customer */}
        <section className="card mt-4 p-4">
          <h2 className="text-sm font-semibold">Customer</h2>
          <p className="mt-2 font-medium">
            {b.customer_name}
            {b.production && <span className="font-normal text-neutral-500"> · {b.production}</span>}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
            {b.customer_email && (
              <a href={`mailto:${b.customer_email}`} className="flex items-center gap-1 hover:text-neutral-900">
                <Mail className="h-3.5 w-3.5" aria-hidden /> {b.customer_email}
              </a>
            )}
            {b.phone && (
              <a href={`tel:${b.phone}`} className="flex items-center gap-1 hover:text-neutral-900">
                <Phone className="h-3.5 w-3.5" aria-hidden /> {b.phone}
              </a>
            )}
          </div>
          {b.message && (
            <blockquote className="mt-3 whitespace-pre-wrap border-l-2 border-neutral-200 pl-3 text-sm text-neutral-800">
              {b.message}
            </blockquote>
          )}
        </section>

        {/* Decision */}
        {(isPending || canCancel(b, "vendor")) && (
          <section className="mt-6">
            <RequestDecision
              id={String(b.id)}
              mode={isPending ? "respond" : "cancel"}
              paid={b.status === BOOKING_STATUS.paid}
              totalLabel={b.total != null ? formatMoney(b.total) : ""}
              customerFirstName={firstName}
            />
          </section>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between px-4 py-2.5 ${strong ? "font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-neutral-500"}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
