"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { BOOKING_STATUS, formatDate, getBooking, todayIso, tokenMatches } from "@/lib/bookings";
import { siteUrl } from "@/lib/site";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function startCheckout(id: string, token: string): Promise<{ error?: string }> {
  const booking = await getBooking(id);
  if (!booking || !tokenMatches(booking.payment_token, token)) {
    return { error: "This payment link isn't valid." };
  }
  if (booking.status !== BOOKING_STATUS.accepted) return { error: "This booking can't be paid right now." };
  if (booking.end_date < todayIso()) return { error: "These dates have passed." };
  if (!booking.total || booking.total <= 0) return { error: "There's no amount due. Contact HV Prop Shop." };

  let url: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: booking.customer_email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(booking.total * 100),
            product_data: {
              name: booking.item_name ?? "Prop rental",
              description: `${booking.quantity} × ${formatDate(booking.start_date)} – ${formatDate(booking.end_date)}`,
            },
          },
        },
      ],
      metadata: { inquiry_id: String(booking.id) },
      success_url: `${siteUrl()}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/pay/${booking.id}?t=${encodeURIComponent(token)}`,
    });
    url = session.url;
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return { error: "Payment is unavailable right now. Please try again shortly." };
  }

  if (!url) return { error: "Payment is unavailable right now. Please try again shortly." };
  redirect(url);
}
