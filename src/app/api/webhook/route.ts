import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createItem, updateItem } from "@directus/sdk";
import { asServer } from "@/lib/serverDirectus";
import { BOOKING_STATUS, getBooking } from "@/lib/bookings";
import { emailVendorPaid } from "@/lib/bookingEmails";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });

  const session = event.data.object as Stripe.Checkout.Session;
  const inquiryId = session.metadata?.inquiry_id;
  if (!inquiryId) return NextResponse.json({ received: true });

  try {
    const booking = await getBooking(inquiryId);
    if (!booking) throw new Error(`Booking ${inquiryId} not found`);

    // Stripe can deliver the same event more than once
    if (booking.status === BOOKING_STATUS.paid) return NextResponse.json({ received: true });

    // The rental is what blocks these dates for everyone else.
    // (Stock isn't decremented — availability is computed from rentals.)
    await asServer(
      createItem("rentals", {
        kind: "booking",
        prop_id: booking.prop_id?.id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        start_date: booking.start_date,
        end_date: booking.end_date,
        quantity: booking.quantity,
        total_paid: (session.amount_total || 0) / 100,
        source_inquiry: booking.id,
        status: "confirmed",
        stripe_payment_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
      })
    );
    await asServer(updateItem("inquiries", booking.id, { status: BOOKING_STATUS.paid }));
    await emailVendorPaid({ ...booking, status: BOOKING_STATUS.paid });

    console.info(`[webhook] Booking ${inquiryId} paid and confirmed`);
  } catch (error) {
    console.error("[webhook] Failed to record payment:", error);
    // 500 tells Stripe to retry later
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
