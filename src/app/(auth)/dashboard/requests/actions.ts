"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateItem } from "@directus/sdk";
import { asServer } from "@/lib/serverDirectus";
import { getActionToken } from "@/lib/actionSession";
import { getCurrentUser } from "@/lib/currentUser";
import { BOOKING_STATUS, getAvailableUnits, getBooking } from "@/lib/bookings";
import { emailCustomerAccepted, emailCustomerDeclined } from "@/lib/bookingEmails";
import { getSiteUrl } from "@/lib/baseUrl";

type Result = { error?: string };

/** The booking, only if it's for one of the logged-in vendor's items. */
async function ownedPendingBooking(id: string) {
  await getActionToken(); // renews the session if needed
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const booking = await getBooking(id);
  if (!booking || booking.prop_id?.user_created?.id !== user.id) return { error: "Request not found." } as const;
  if (booking.status !== BOOKING_STATUS.pending) return { error: "This request was already answered." } as const;
  return { booking } as const;
}

export async function acceptRequest(id: string): Promise<Result> {
  try {
    const found = await ownedPendingBooking(id);
    if ("error" in found) return { error: found.error };
    const b = found.booking;

    // Re-check: something may have been booked or blocked since the request came in
    const available = await getAvailableUnits(
      b.prop_id!.id,
      b.prop_id!.quantity_available ?? 0,
      b.start_date,
      b.end_date,
      b.id
    );
    if (available < b.quantity) {
      return {
        error:
          available === 0
            ? "It's no longer available for those dates. Decline the request, or remove a block first."
            : `Only ${available} available for those dates now. Decline, or free up units first.`,
      };
    }

    const paymentToken = b.payment_token || randomUUID();
    await asServer(
      updateItem("inquiries", b.id, {
        status: BOOKING_STATUS.accepted,
        payment_token: paymentToken,
        responded_at: new Date().toISOString(),
      })
    );
    await emailCustomerAccepted(
      { ...b, status: BOOKING_STATUS.accepted, payment_token: paymentToken },
      `${await getSiteUrl()}/pay/${b.id}?t=${paymentToken}`
    );
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("Accept request error:", error);
    return { error: "Couldn't accept the request. Please try again." };
  }

  revalidatePath("/dashboard", "layout");
  return {};
}

export async function declineRequest(id: string, reason: string): Promise<Result> {
  try {
    const found = await ownedPendingBooking(id);
    if ("error" in found) return { error: found.error };
    const decline_reason = reason.trim().slice(0, 500) || null;

    await asServer(
      updateItem("inquiries", found.booking.id, {
        status: BOOKING_STATUS.declined,
        decline_reason,
        responded_at: new Date().toISOString(),
      })
    );
    await emailCustomerDeclined({ ...found.booking, decline_reason });
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error("Decline request error:", error);
    return { error: "Couldn't decline the request. Please try again." };
  }

  revalidatePath("/dashboard", "layout");
  return {};
}

function isRedirect(error: unknown) {
  return (error as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT") ?? false;
}
