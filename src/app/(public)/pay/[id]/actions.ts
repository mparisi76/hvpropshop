"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cancelBooking } from "@/lib/cancellations";
import { BOOKING_STATUS, formatDate, getBooking, todayIso, tokenMatches } from "@/lib/bookings";
import { getSiteUrl } from "@/lib/baseUrl";
import { checkExistingCheckout, saveCheckoutSessionId, stripe } from "@/lib/payments";

/** `paid: true` means it turned out to be paid already — refresh the page. */
export async function startCheckout(id: string, token: string): Promise<{ error?: string; paid?: boolean }> {
  const booking = await getBooking(id);
  if (!booking || !tokenMatches(booking.payment_token, token)) {
    return { error: "This payment link isn't valid." };
  }
  if (booking.status === BOOKING_STATUS.paid) return { paid: true };
  if (booking.status !== BOOKING_STATUS.accepted) return { error: "This booking can't be paid right now." };
  if (booking.end_date < todayIso()) return { error: "These dates have passed." };
  if (!booking.total || booking.total <= 0) return { error: "There's no amount due. Contact HV Prop Shop." };
  if (booking.total < 0.5) return { error: "The amount is below the card minimum ($0.50). Contact HV Prop Shop." };

  // Never start a second checkout: resume the open one, or record a payment
  // Stripe already took (if the webhook hasn't arrived yet)
  const existing = await checkExistingCheckout(booking.id);
  if (existing.state === "paid") {
    revalidatePath(`/pay/${id}`);
    return { paid: true };
  }
  if (existing.state === "open") redirect(existing.url);

  const base = await getSiteUrl();

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
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pay/${booking.id}?t=${encodeURIComponent(token)}`,
    });
    url = session.url;
    await saveCheckoutSessionId(booking.id, session.id);
  } catch (error) {
    const e = error as { type?: string; code?: string; message?: string };
    console.error("Stripe checkout error:", e?.type, e?.code, e?.message ?? error);
    return { error: "Payment is unavailable right now. Please try again shortly." };
  }

  if (!url) return { error: "Payment is unavailable right now. Please try again shortly." };
  redirect(url);
}

/** Customer cancels from their private booking link; refund follows the policy. */
export async function cancelAsCustomer(id: string, token: string): Promise<{ error?: string }> {
  try {
    const booking = await getBooking(id);
    if (!booking || !tokenMatches(booking.payment_token, token)) return { error: "This link isn't valid." };
    const result = await cancelBooking(booking, "customer", "");
    if (result.error) return { error: result.error };
  } catch (error) {
    console.error("Customer cancel error:", error);
    return { error: "Couldn't cancel. Please try again or contact HV Prop Shop." };
  }
  revalidatePath(`/pay/${id}`);
  revalidatePath("/dashboard", "layout");
  return {};
}
