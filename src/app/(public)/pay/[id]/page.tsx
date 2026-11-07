/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BOOKING_STATUS,
  formatDate,
  formatMoney,
  getBooking,
  rentalDays,
  todayIso,
  tokenMatches,
} from "@/lib/bookings";
import PayButton from "./PayButton";

export const metadata: Metadata = {
  title: "Complete your booking | HV Prop Shop",
  robots: { index: false },
};

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ id }, { t: token = "" }] = await Promise.all([params, searchParams]);

  const booking = await getBooking(id).catch(() => null);
  if (!booking || !tokenMatches(booking.payment_token, token)) notFound();

  const shop =
    booking.prop_id?.user_created?.shop_name || booking.prop_id?.user_created?.first_name || "The vendor";
  const days = rentalDays(booking.start_date, booking.end_date);
  const expired = booking.end_date < todayIso();

  let notice: { title: string; body: string } | null = null;
  if (booking.status === BOOKING_STATUS.paid) {
    notice = { title: "You're booked", body: "This booking is paid and confirmed. Check your email for the receipt." };
  } else if (booking.status === BOOKING_STATUS.pending) {
    notice = { title: "Waiting for confirmation", body: `${shop} hasn't confirmed this request yet. We'll email you when they do.` };
  } else if (booking.status === BOOKING_STATUS.declined || booking.status === BOOKING_STATUS.cancelled) {
    notice = { title: "No longer available", body: "This request can't be booked. You haven't been charged." };
  } else if (expired) {
    notice = { title: "These dates have passed", body: "This booking can no longer be paid. You haven't been charged." };
  }

  const thumb = booking.prop_id?.thumbnail;

  return (
    <div className="container-page max-w-lg! py-10">
      <p className="eyebrow">Booking</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        {notice ? notice.title : "Complete your booking"}
      </h1>
      {notice ? (
        <p className="mt-2 text-sm text-neutral-600">{notice.body}</p>
      ) : (
        <p className="mt-2 text-sm text-neutral-600">{shop} confirmed it&apos;s available. Pay to lock it in.</p>
      )}

      <div className="card mt-6 overflow-hidden">
        <div className="flex gap-3 border-b border-neutral-200 p-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100">
            {thumb && (
              <img
                src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${thumb}?width=128&height=128&fit=cover&format=webp`}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0">
            {booking.prop_id ? (
              <Link href={`/props/${booking.prop_id.id}`} className="block truncate font-medium hover:underline">
                {booking.item_name ?? booking.prop_id.name}
              </Link>
            ) : (
              <p className="truncate font-medium">{booking.item_name}</p>
            )}
            <p className="text-sm text-neutral-500">{shop}</p>
          </div>
        </div>
        <dl className="divide-y divide-neutral-200 text-sm">
          <Row label="Pickup" value={formatDate(booking.start_date)} />
          <Row label="Return" value={formatDate(booking.end_date)} />
          <Row label="Quantity" value={String(booking.quantity)} />
          <Row label="Days" value={String(days)} />
          <Row label="Total" value={formatMoney(booking.total)} strong />
        </dl>
      </div>

      {!notice && (
        <div className="mt-6">
          <PayButton id={String(booking.id)} token={token} label={`Pay ${formatMoney(booking.total)}`} />
        </div>
      )}
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
