import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import TrackEvent from "@/components/TrackEvent";
import { getBooking } from "@/lib/bookings";
import { recordPayment, stripe } from "@/lib/payments";
import { reportError } from "@/lib/alerts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Booking confirmed | HV Prop Shop", robots: { index: false, follow: false } };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string }>;
}) {
  const { session_id } = await searchParams;

  // 1. Get the session details from Stripe
  const session = await stripe.checkout.sessions.retrieve(session_id);
  const inquiryId = session.metadata?.inquiry_id;

  // Record the booking now rather than waiting for Stripe's webhook (whichever comes first wins)
  await recordPayment(session).catch((error) =>
    reportError("Couldn't record payment from the success page", error, {
      booking: session.metadata?.inquiry_id,
      stripeSession: session.id,
      note: "The Stripe webhook should still record it; check the booking if another alert follows.",
    })
  );


  // 2. Item name from the booking (read with the server token — bookings aren't public)
  let propName = "your rental";
  if (inquiryId) {
    const booking = await getBooking(inquiryId).catch(() => null);
    propName = booking?.item_name || "your rental";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="card w-full max-w-md p-6 shadow-sm sm:p-8">
        <TrackEvent
          name="Booking paid"
          eventKey={session.id}
          props={{ amount: Math.round((session.amount_total || 0) / 100) }}
        />
        <CheckCircle2 className="h-8 w-8 text-accent" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Booking confirmed</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Thanks{session.customer_details?.name ? `, ${session.customer_details.name}` : ""}.
          Your booking for{" "}
          <span className="font-medium text-neutral-900">{propName}</span> is confirmed.
        </p>

        <dl className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200 text-sm">
          <div className="flex justify-between py-2.5">
            <dt className="text-neutral-500">Amount paid</dt>
            <dd className="font-medium tabular-nums">
              ${((session.amount_total || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-neutral-500">Receipt sent to</dt>
            <dd className="truncate font-medium">{session.customer_details?.email}</dd>
          </div>
        </dl>

        <Link href="/" className="btn-primary mt-6 w-full">
          Back to inventory
        </Link>
      </div>
    </div>
  );
}
