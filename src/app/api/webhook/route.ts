import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { recordPayment, stripe } from "@/lib/payments";

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
      console.error("[webhook] Failed to record payment:", error);
      // 500 tells Stripe to retry later
      return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
