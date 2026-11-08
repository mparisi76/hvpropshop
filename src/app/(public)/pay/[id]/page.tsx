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
  CANCELLATION_POLICY,
} from "@/lib/bookings";
import PayButton from "./PayButton";
import CancelSection from "./CancelSection";
import StatusRefresher from "./StatusRefresher";
import { checkExistingCheckout } from "@/lib/payments";
import { canCancel, refundFor } from "@/lib/cancellations";

export const metadata: Metadata = {
  title: "Your booking request | HV Prop Shop",
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

  let booking = await getBooking(id).catch(() => null);
  if (!booking || !tokenMatches(booking.payment_token, token)) notFound();

  // Paid in Stripe but the webhook hasn't landed yet? Record it now so we never ask twice.
  if (booking.status === BOOKING_STATUS.accepted) {
    const existing = await checkExistingCheckout(booking.id);
    if (existing.state === "paid") booking = (await getBooking(id).catch(() => null)) ?? booking;
  }

  const shop =
    booking.prop_id?.user_created?.shop_name || booking.prop_id?.user_created?.first_name || "The vendor";
  const days = rentalDays(booking.start_date, booking.end_date);
  const expired = booking.end_date < todayIso();

  let notice: { title: string; body: string } | null = null;
  if (booking.status === BOOKING_STATUS.paid) {
    notice = { title: "You're booked", body: "This booking is paid and confirmed. Check your email for the receipt." };
  } else if (booking.status === BOOKING_STATUS.pending) {
    notice = { title: "Waiting for confirmation", body: `${shop} hasn't confirmed this request yet. We'll email you when they do.` };
  } else if (booking.status === BOOKING_STATUS.cancelled) {
    notice = {
      title: "Booking cancelled",
      body: "This booking was cancelled. If you'd paid, any refund goes back to your original card within 5–10 business days.",
    };
  } else if (booking.status === BOOKING_STATUS.declined) {
    notice = { title: "No longer available", body: "This request can't be booked. You haven't been charged." };
  } else if (expired) {
    notice = { title: "These dates have passed", body: "This booking can no longer be paid. You haven't been charged." };
  }

  const thumb = booking.prop_id?.thumbnail;

  // What cancelling right now would mean for the customer
  let cancelOutcome: string | null = null;
  if (canCancel(booking, "customer")) {
    if (booking.status !== BOOKING_STATUS.paid) {
      cancelOutcome = "You haven't paid, so you can cancel at no cost.";
    } else {
      const { percent, amount } = refundFor(booking, "customer");
      cancelOutcome =
        percent === 100
          ? `If you cancel now, you'll be refunded ${formatMoney(amount)} in full.`
          : percent === 50
            ? `Pickup is less than 3 days away, so cancelling now refunds 50% (${formatMoney(amount)}).`
            : "Pickup is today, so cancelling now isn't refundable.";
    }
  }

  return (
    <div className="container-page max-w-lg! py-10">
      <p className="eyebrow">Booking</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        {notice ? notice.title : "Complete your booking"}
      </h1>
      {notice ? (
        <>
          <p className="mt-2 text-sm text-neutral-600">{notice.body}</p>
          {booking.status === BOOKING_STATUS.pending && <StatusRefresher />}
        </>
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

      {(!notice || booking.status === BOOKING_STATUS.paid) && (
        <p className="mt-4 text-xs text-neutral-500">
          <span className="font-medium text-neutral-700">Cancellation policy:</span> {CANCELLATION_POLICY}{" "}
          <Link href="/policies" className="underline underline-offset-2 hover:text-neutral-900">
            All rental policies
          </Link>
        </p>
      )}

      {cancelOutcome && <CancelSection id={String(booking.id)} token={token} outcome={cancelOutcome} />}
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
