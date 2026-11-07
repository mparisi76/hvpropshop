/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { getCurrentUser } from "@/lib/currentUser";
import {
  BOOKING_STATUS,
  formatDate,
  formatMoney,
  getVendorBookings,
  todayIso,
  type Booking,
} from "@/lib/bookings";
import RequestActions from "./RequestActions";

export default async function RequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let bookings: Booking[] = [];
  let loadError = false;
  try {
    bookings = await getVendorBookings(user.id);
  } catch (error) {
    console.error("Load bookings error:", error);
    loadError = true;
  }

  const today = todayIso();
  const pending = bookings.filter((b) => b.status === BOOKING_STATUS.pending);
  const awaitingPayment = bookings.filter((b) => b.status === BOOKING_STATUS.accepted && b.end_date >= today);
  const upcoming = bookings
    .filter((b) => b.status === BOOKING_STATUS.paid && b.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const past = bookings.filter(
    (b) => !pending.includes(b) && !awaitingPayment.includes(b) && !upcoming.includes(b)
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader />

      <main className="container-page max-w-3xl! py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Customers only pay after you accept, so check availability before accepting.
        </p>

        {loadError ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Couldn&apos;t load requests. If this keeps happening, contact HV Prop Shop.
          </p>
        ) : bookings.length === 0 ? (
          <div className="card mt-6 px-6 py-16 text-center">
            <h2 className="text-base font-semibold">No requests yet</h2>
            <p className="mt-1 text-sm text-neutral-600">
              When someone asks to book one of your items, it shows up here and we email you.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            <Group title="Needs your response" empty="You're all caught up." bookings={pending} showActions />
            <Group title="Accepted · waiting for payment" bookings={awaitingPayment} />
            <Group title="Booked" bookings={upcoming} />
            <Group title="Past and declined" bookings={past} muted />
          </div>
        )}
      </main>
    </div>
  );
}

function Group({
  title,
  bookings,
  empty,
  showActions,
  muted,
}: {
  title: string;
  bookings: Booking[];
  empty?: string;
  showActions?: boolean;
  muted?: boolean;
}) {
  if (bookings.length === 0 && !empty) return null;
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-neutral-700">
        {title} <span className="font-normal text-neutral-400">({bookings.length})</span>
      </h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-neutral-500">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id} className={`card p-4 ${muted ? "opacity-75" : ""}`}>
              <BookingCard booking={b} showActions={showActions} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Needs response",
  accepted: "Awaiting payment",
  paid: "Paid",
  declined: "Declined",
  cancelled: "Cancelled",
};

function BookingCard({ booking: b, showActions }: { booking: Booking; showActions?: boolean }) {
  const thumb = b.prop_id?.thumbnail;
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100">
          {thumb && (
            <img
              src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${thumb}?width=112&height=112&fit=cover&format=webp`}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            {b.prop_id ? (
              <Link href={`/dashboard/edit/${b.prop_id.id}`} className="truncate font-medium hover:underline">
                {b.item_name ?? b.prop_id.name}
              </Link>
            ) : (
              <p className="truncate font-medium">{b.item_name}</p>
            )}
            <span className="shrink-0 rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
              {STATUS_LABEL[b.status] ?? b.status}
            </span>
          </div>
          <p className="text-sm text-neutral-600">
            {formatDate(b.start_date)} → {formatDate(b.end_date)} · {b.quantity}{" "}
            {b.quantity === 1 ? "unit" : "units"}
            {b.total != null && <> · {formatMoney(b.total)}</>}
          </p>
        </div>
      </div>

      <div className="rounded-md bg-neutral-50 px-3 py-2 text-sm">
        <p className="font-medium">
          {b.customer_name}
          {b.production && <span className="font-normal text-neutral-500"> · {b.production}</span>}
        </p>
        <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-neutral-600">
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
        </p>
        {b.message && <p className="mt-2 whitespace-pre-wrap text-neutral-700">{b.message}</p>}
        {b.status === BOOKING_STATUS.declined && b.decline_reason && (
          <p className="mt-2 text-neutral-500">Your note: {b.decline_reason}</p>
        )}
      </div>

      {showActions && <RequestActions id={String(b.id)} />}
    </div>
  );
}
