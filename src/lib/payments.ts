import Stripe from "stripe";
import { createItem, readItems, updateItem } from "@directus/sdk";
import { asServer } from "@/lib/serverDirectus";
import { BOOKING_STATUS, getBooking, type Booking } from "@/lib/bookings";
import { emailCustomerBooked, emailVendorPaid } from "@/lib/bookingEmails";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/* ---------- Remembering each booking's Stripe checkout ---------- */
// Stored in inquiries.stripe_session_id. Read/written separately and tolerantly,
// so a missing field degrades gracefully instead of breaking booking pages.

export async function getCheckoutSessionId(bookingId: string | number) {
  try {
    const [row] = (await asServer(
      readItems("inquiries", { fields: ["stripe_session_id"], filter: { id: { _eq: bookingId } }, limit: 1 })
    )) as unknown as { stripe_session_id: string | null }[];
    return row?.stripe_session_id ?? null;
  } catch {
    return null;
  }
}

export async function saveCheckoutSessionId(bookingId: string | number, sessionId: string) {
  try {
    await asServer(updateItem("inquiries", bookingId, { stripe_session_id: sessionId }));
  } catch (error) {
    console.warn(`[payments] Couldn't save stripe_session_id for booking ${bookingId} (does the field exist?):`, error);
  }
}

/* ---------- Recording a payment ---------- */

// Webhook and success page can arrive at the same moment; share one run per booking.
const inFlight = new Map<string, Promise<"recorded" | "already" | "refunded">>();

/**
 * Mark a booking paid from a completed Stripe checkout: block the dates with a
 * rental, set the booking to paid, email the vendor. Safe to call repeatedly
 * (webhook, success page, booking page) — only the first call does anything.
 */
export async function recordPayment(session: Stripe.Checkout.Session) {
  const id = session.metadata?.inquiry_id;
  if (!id || session.payment_status !== "paid") return "skipped" as const;

  let run = inFlight.get(id);
  if (!run) {
    run = doRecord(id, session).finally(() => setTimeout(() => inFlight.delete(id), 30_000));
    inFlight.set(id, run);
  }
  return run;
}

async function doRecord(
  id: string,
  session: Stripe.Checkout.Session
): Promise<"recorded" | "already" | "refunded"> {
  const booking = await getBooking(id);
  if (!booking) throw new Error(`Booking ${id} not found`);
  if (booking.status === BOOKING_STATUS.paid) return "already";

  // Paid after the booking was cancelled, declined or its hold released (e.g. a
  // checkout tab left open)? Don't double-book — refund it in full.
  if (booking.status !== BOOKING_STATUS.accepted && booking.status !== "pending_payment") {
    if (typeof session.payment_intent === "string") {
      await stripe.refunds.create(
        { payment_intent: session.payment_intent },
        { idempotencyKey: `late-payment-${id}` }
      );
    }
    console.warn(`[payments] Payment for booking ${id} arrived while it was "${booking.status}" — refunded`);
    return "refunded";
  }

  // Don't create a second rental if one already exists for this booking
  const [existing] = (await asServer(
    readItems("rentals", {
      fields: ["id"],
      filter: { _and: [{ source_inquiry: { _eq: booking.id } }, { kind: { _eq: "booking" } }] },
      limit: 1,
    })
  )) as unknown as { id: string | number }[];

  if (!existing) {
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
  }

  await asServer(updateItem("inquiries", booking.id, { status: BOOKING_STATUS.paid }));
  const paid = { ...booking, status: BOOKING_STATUS.paid } as Booking;
  await Promise.all([emailVendorPaid(paid), emailCustomerBooked(paid)]);
  console.info(`[payments] Booking ${id} paid and confirmed`);
  return "recorded";
}

/**
 * If this booking already has a checkout, check it with Stripe:
 * - paid → record it (in case the webhook hasn't arrived) and report "paid"
 * - still open → return its URL so the customer resumes it instead of paying twice
 */
export async function checkExistingCheckout(bookingId: string | number) {
  const sessionId = await getCheckoutSessionId(bookingId);
  if (!sessionId) return { state: "none" as const };
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      await recordPayment(session);
      return { state: "paid" as const };
    }
    if (session.status === "open" && session.url) return { state: "open" as const, url: session.url };
  } catch (error) {
    console.warn(`[payments] Couldn't check checkout ${sessionId}:`, error);
  }
  return { state: "none" as const };
}
