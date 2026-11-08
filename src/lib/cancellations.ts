import { readItems, updateItem } from "@directus/sdk";
import { asServer } from "@/lib/serverDirectus";
import { BOOKING_STATUS, customerRefundPercent, todayIso, type Booking } from "@/lib/bookings";
import { emailBookingCancelled } from "@/lib/bookingEmails";
import { stripe } from "@/lib/payments";

export type CancelledBy = "vendor" | "customer";

const OPEN_STATUSES: string[] = [BOOKING_STATUS.pending, BOOKING_STATUS.accepted, BOOKING_STATUS.paid];

/** Whether this party can still cancel the booking. */
export function canCancel(b: Booking, by: CancelledBy) {
  if (!OPEN_STATUSES.includes(b.status)) return false;
  const today = todayIso();
  // Customers can cancel up to and including the pickup day; vendors until the return date
  return by === "customer" ? b.start_date >= today : b.end_date >= today;
}

/** What a cancellation would refund right now. Unpaid requests refund nothing. */
export function refundFor(b: Booking, by: CancelledBy, amountPaid = Number(b.total) || 0) {
  if (b.status !== BOOKING_STATUS.paid) return { percent: 0, amount: 0 };
  const percent = by === "vendor" ? 100 : customerRefundPercent(b.start_date);
  return { percent, amount: Math.round(amountPaid * percent) / 100 };
}

interface PaidRental {
  id: string | number;
  status: string;
  total_paid: number | null;
  stripe_payment_id: string | null;
}

async function findRental(b: Booking) {
  const [rental] = (await asServer(
    readItems("rentals", {
      fields: ["id", "status", "total_paid", "stripe_payment_id"],
      filter: { _and: [{ source_inquiry: { _eq: b.id } }, { kind: { _eq: "booking" } }] },
      limit: 1,
    })
  )) as unknown as PaidRental[];
  return rental ?? null;
}

/**
 * Cancel a booking: mark it cancelled, refund through Stripe per the policy,
 * free the dates and email both sides.
 *
 * Order matters: the booking is marked cancelled *before* refunding (so a
 * Directus problem can't leave a refund with no record), and put back if the
 * refund fails.
 */
export async function cancelBooking(
  b: Booking,
  by: CancelledBy,
  reason: string
): Promise<{ error?: string; refunded?: number }> {
  if (!canCancel(b, by)) return { error: "This booking can't be cancelled anymore." };

  const rental = b.status === BOOKING_STATUS.paid ? await findRental(b) : null;
  if (b.status === BOOKING_STATUS.paid && !rental?.stripe_payment_id) {
    return { error: "We couldn't find the payment for this booking. Please contact HV Prop Shop to cancel." };
  }

  const amountPaid = Number(rental?.total_paid ?? b.total) || 0;
  const { amount } = refundFor(b, by, amountPaid);
  const note = reason.trim().slice(0, 500) || null;

  // 1. Mark cancelled
  await asServer(
    updateItem("inquiries", b.id, {
      status: BOOKING_STATUS.cancelled,
      cancelled_by: by,
      cancel_reason: note,
      cancelled_at: new Date().toISOString(),
      refund_amount: amount,
    })
  );

  // 2. Refund (idempotent — retrying never refunds twice)
  if (amount > 0 && rental?.stripe_payment_id) {
    try {
      await stripe.refunds.create(
        { payment_intent: rental.stripe_payment_id, amount: Math.round(amount * 100) },
        { idempotencyKey: `cancel-booking-${b.id}` }
      );
    } catch (error) {
      console.error(`[cancel] Refund failed for booking ${b.id}:`, error);
      await asServer(updateItem("inquiries", b.id, { status: b.status, refund_amount: null })).catch(() => {});
      return { error: "The refund couldn't be processed, so the booking is still active. Please try again." };
    }
  }

  // 3. Free the dates
  if (rental) {
    await asServer(updateItem("rentals", rental.id, { status: "cancelled" })).catch((error) =>
      console.error(`[cancel] Couldn't release rental ${rental.id}:`, error)
    );
  }

  await emailBookingCancelled({ ...b, status: BOOKING_STATUS.cancelled }, by, amount, note, b.status === BOOKING_STATUS.paid);
  return { refunded: amount };
}
