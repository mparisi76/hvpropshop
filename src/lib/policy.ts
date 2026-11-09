/** Customer cancellation policy (the refund rules live in customerRefundPercent in lib/bookings). */
export const CANCELLATION_POLICY =
  "Full refund if you cancel 3 or more days before pickup, 50% within 3 days, and no refund on or after the pickup day.";

/** HV Prop Shop's commission, taken from the vendor's share. */
export const PLATFORM_FEE_RATE = 0.15;

/** What the vendor receives from an amount the customer paid. */
export function vendorShare(amountPaid: number) {
  return Math.round(amountPaid * (1 - PLATFORM_FEE_RATE) * 100) / 100;
}
