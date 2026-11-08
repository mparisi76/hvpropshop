import { updateItem } from "@directus/sdk";
import { asServer } from "@/lib/serverDirectus";
import { BOOKING_STATUS, findBookings, type Booking } from "@/lib/bookings";
import {
  emailCustomerPaymentReminder,
  emailHoldReleased,
  emailPickupReminder,
  emailReturnReminder,
} from "@/lib/bookingEmails";
import { getCheckoutSessionId, stripe } from "@/lib/payments";
import { addDays, businessDate, businessToday } from "@/lib/site";

/** Days after acceptance before an unpaid hold is released. */
export const HOLD_DAYS = 2;

type Accepted = Booking & { responded_at: string | null };

/** Release an unpaid hold: close its checkout, cancel the request, email both sides. */
async function releaseHold(b: Accepted) {
  // Make sure the customer can't pay into a released hold
  const sessionId = await getCheckoutSessionId(b.id);
  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.status === "open") await stripe.checkout.sessions.expire(sessionId);
      if (session.payment_status === "paid") return false; // paid after all — leave it for recordPayment
    } catch (error) {
      console.warn(`[jobs] Couldn't close checkout for booking ${b.id}:`, error);
    }
  }

  await asServer(
    updateItem("inquiries", b.id, {
      status: BOOKING_STATUS.cancelled,
      cancelled_by: "system",
      cancel_reason: `Not paid within ${HOLD_DAYS} days of acceptance`,
      cancelled_at: new Date().toISOString(),
      refund_amount: 0,
    })
  );
  await emailHoldReleased(b);
  return true;
}

/**
 * Runs once a day (a Coolify Scheduled Task calls /api/cron/bookings):
 * - day after acceptance: remind the customer to pay
 * - HOLD_DAYS after acceptance (or once the dates pass): release the unpaid hold
 * - day before pickup / return: remind customer and vendor
 *
 * Each step selects by date, so a booking gets each email once when the job
 * runs daily.
 */
export async function runDailyBookingJobs() {
  const today = businessToday();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  const releaseOnOrBefore = addDays(today, -HOLD_DAYS);
  const summary = { reminded: 0, released: 0, pickupReminders: 0, returnReminders: 0, errors: 0 };

  const step = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (error) {
      summary.errors++;
      console.error(`[jobs] ${label} failed:`, error);
    }
  };

  // 1–2. Unpaid holds
  const accepted = (await findBookings({ status: { _eq: BOOKING_STATUS.accepted } })) as Accepted[];
  for (const b of accepted) {
    const acceptedOn = businessDate(b.responded_at ?? b.date_created ?? new Date());
    if (acceptedOn <= releaseOnOrBefore || b.end_date < today) {
      await step(`release ${b.id}`, async () => {
        if (await releaseHold(b)) summary.released++;
      });
    } else if (acceptedOn === yesterday) {
      await step(`payment reminder ${b.id}`, async () => {
        await emailCustomerPaymentReminder(b, addDays(acceptedOn, HOLD_DAYS));
        summary.reminded++;
      });
    }
  }

  // 3. Pickup and return reminders
  const [pickups, returns] = await Promise.all([
    findBookings({ _and: [{ status: { _eq: BOOKING_STATUS.paid } }, { start_date: { _eq: tomorrow } }] }),
    findBookings({ _and: [{ status: { _eq: BOOKING_STATUS.paid } }, { end_date: { _eq: tomorrow } }] }),
  ]);
  for (const b of pickups) {
    await step(`pickup reminder ${b.id}`, async () => {
      await emailPickupReminder(b);
      summary.pickupReminders++;
    });
  }
  for (const b of returns) {
    if (b.start_date === b.end_date) continue; // same-day rental: the pickup reminder covers it
    await step(`return reminder ${b.id}`, async () => {
      await emailReturnReminder(b);
      summary.returnReminders++;
    });
  }

  console.info("[jobs] Daily booking jobs:", summary);
  return summary;
}
