"use server";

import { randomUUID } from "node:crypto";
import { createItem, readItems } from "@directus/sdk";
import { asServer } from "@/lib/serverDirectus";
import {
  BOOKING_STATUS,
  bookingTotal,
  getAvailableUnits,
  getBooking,
  isIsoDate,
  todayIso,
} from "@/lib/bookings";
import { emailCustomerRequestReceived, emailVendorNewRequest } from "@/lib/bookingEmails";

export type BookingRequestState = {
  success?: boolean;
  error?: string;
  email?: string;
  /** Echo of submitted values so the form can repopulate after an error */
  values?: Record<string, string>;
} | null;

const FIELDS = ["name", "email", "phone", "production", "start", "end", "quantity", "message"] as const;
const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max);

export async function requestBooking(
  _prev: BookingRequestState,
  formData: FormData
): Promise<BookingRequestState> {
  const values = Object.fromEntries(
    FIELDS.map((f) => [f, clean(formData.get(f), f === "message" ? 2000 : 200)])
  ) as Record<(typeof FIELDS)[number], string>;
  const fail = (error: string): BookingRequestState => ({ error, values });

  // Honeypot: hidden from people, tempting to bots
  if (clean(formData.get("website_url"))) return { success: true, email: values.email };

  const propId = clean(formData.get("prop_id"), 50);
  const quantity = parseInt(values.quantity) || 1;

  if (!values.name) return fail("Please enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return fail("Please enter a valid email address.");
  if (!isIsoDate(values.start) || !isIsoDate(values.end)) return fail("Please choose pickup and return dates.");
  if (values.start < todayIso()) return fail("The pickup date has already passed.");
  if (values.end < values.start) return fail("The return date is before the pickup date.");
  if (quantity < 1) return fail("Quantity must be at least 1.");

  try {
    // Load the item server-side — never trust price or stock from the browser
    const [prop] = (await asServer(
      readItems("props", {
        fields: ["id", "name", "price", "quantity_available", { user_created: ["email"] }],
        filter: { _and: [{ id: { _eq: propId } }, { status: { _eq: "published" } }] },
        limit: 1,
      })
    )) as unknown as {
      id: string | number;
      name: string;
      price: number | null;
      quantity_available: number | null;
      user_created: { email: string | null } | null;
    }[];
    if (!prop) return fail("This item is no longer available.");

    const available = await getAvailableUnits(prop.id, prop.quantity_available ?? 0, values.start, values.end);
    if (available < quantity) {
      return fail(
        available === 0
          ? "Sorry, it's already booked for those dates. Try different dates."
          : `Only ${available} available for those dates.`
      );
    }

    const created = (await asServer(
      createItem("inquiries", {
        prop_id: String(prop.id),
        item_name: prop.name,
        vendor_email: prop.user_created?.email ?? null,
        customer_name: values.name,
        customer_email: values.email,
        phone: values.phone || null,
        production: values.production || null,
        start_date: values.start,
        end_date: values.end,
        quantity,
        total: bookingTotal(Number(prop.price) || 0, quantity, values.start, values.end),
        message: values.message || null,
        status: BOOKING_STATUS.pending,
        payment_token: randomUUID(),
      })
    )) as { id: string | number };

    const booking = await getBooking(created.id);
    if (booking) {
      await Promise.all([emailVendorNewRequest(booking), emailCustomerRequestReceived(booking)]);
    }
  } catch (error) {
    console.error("Booking request error:", error);
    return fail("We couldn't send your request. Please try again.");
  }

  return { success: true, email: values.email };
}
