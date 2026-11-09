import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { recordPayment, stripe } from "@/lib/payments";
import { reportError } from "@/lib/alerts";

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

  if (event.type === "checkout.session.completed") {
    try {
      await recordPayment(event.data.object as Stripe.Checkout.Session);
    } catch (error) {
      const session = event.data.object as Stripe.Checkout.Session;
      await reportError("Payment taken but NOT recorded (Stripe webhook)", error, {
        booking: session.metadata?.inquiry_id,
        stripeSession: session.id,
        amount: (session.amount_total ?? 0) / 100,
        note: "Stripe will retry automatically. If this keeps failing, check the booking in Directus.",
      });
      // 500 tells Stripe to retry later
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
