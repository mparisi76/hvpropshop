import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/site";
import { getSiteUrl } from "@/lib/baseUrl";
import { formatDate, formatMoney, type Booking } from "@/lib/bookings";
import { CANCELLATION_POLICY, PLATFORM_FEE_RATE, vendorShare } from "@/lib/policy";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "HV Prop Shop <onboarding@hvpropshop.com>";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.5;color:#171717;max-width:560px">
  <h2 style="font-size:18px;margin:0 0 16px">${esc(title)}</h2>
  ${body}
  <p style="margin-top:32px;color:#737373;font-size:12px">HV Prop Shop · Props and set dressing, Hudson Valley to NYC<br>
  <a href="https://hvpropshop.com/policies" style="color:#737373">Rental policies</a> ·
  <a href="https://hvpropshop.com/terms" style="color:#737373">Terms</a> ·
  <a href="https://hvpropshop.com/privacy" style="color:#737373">Privacy</a></p>
</div>`;
}

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#1f4d3a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">${esc(label)}</a></p>`;

function summary(b: Booking) {
  const row = (k: string, v: string) =>
    v ? `<tr><td style="padding:3px 16px 3px 0;color:#737373;vertical-align:top">${k}</td><td style="padding:3px 0">${esc(v)}</td></tr>` : "";
  return `<table style="border-collapse:collapse">
    ${row("Item", b.item_name ?? b.prop_id?.name ?? "")}
    ${row("Dates", `${formatDate(b.start_date)} → ${formatDate(b.end_date)}`)}
    ${row("Quantity", String(b.quantity))}
    ${row("Total", b.total != null ? formatMoney(b.total) : "")}
  </table>`;
}

async function send(to: string | null | undefined, subject: string, html: string, replyTo?: string | null) {
  if (!to) return;
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html, replyTo: replyTo || undefined });
    if (error) console.error(`[email] "${subject}" to ${to} failed:`, error);
  } catch (error) {
    console.error(`[email] "${subject}" to ${to} failed:`, error);
  }
}

const vendorEmail = (b: Booking) => b.prop_id?.user_created?.email;

/** Private page showing the request's current status (and the Pay button once accepted). */
export const bookingStatusUrl = (b: Booking, base: string) =>
  b.payment_token ? `${base}/pay/${b.id}?t=${encodeURIComponent(b.payment_token)}` : null;
const shopName = (b: Booking) =>
  b.prop_id?.user_created?.shop_name || b.prop_id?.user_created?.first_name || "the vendor";

/* ---------- To the vendor ---------- */

export async function emailVendorNewRequest(b: Booking) {
  const base = await getSiteUrl();
  const contact = [b.customer_name, b.production, b.customer_email, b.phone].filter(Boolean).join(" · ");
  return send(
    vendorEmail(b),
    `Booking request: ${b.item_name}`,
    layout(
      "New booking request",
      `<p>${esc(contact)} would like to book:</p>
       ${summary(b)}
       ${b.message ? `<p style="margin-top:16px"><strong>Notes:</strong><br>${esc(b.message).replace(/\n/g, "<br>")}</p>` : ""}
       <p>Nothing is charged until you accept and they pay.</p>
       ${button(`${base}/dashboard/requests/${b.id}`, "Review and respond")}`
    ),
    b.customer_email
  );
}

export async function emailVendorPaid(b: Booking) {
  const base = await getSiteUrl();
  return send(
    vendorEmail(b),
    `Booked and paid: ${b.item_name}`,
    layout(
      "Booking confirmed and paid",
      `<p>${esc(b.customer_name)} has paid for:</p>${summary(b)}
       <p>Reply to this email to reach them about pickup and return.</p>
       ${
         b.total != null
           ? `<p><strong>Your payout:</strong> ${formatMoney(vendorShare(Number(b.total)))} (after the ${Math.round(
               PLATFORM_FEE_RATE * 100
             )}% commission), sent to your Stripe account the day after the return date.</p>`
           : ""
       }
       ${button(`${base}/dashboard/requests/${b.id}`, "View booking")}`
    ),
    b.customer_email
  );
}

/* ---------- To the customer ---------- */

export async function emailCustomerRequestReceived(b: Booking) {
  const base = await getSiteUrl();
  return send(
    b.customer_email,
    `Request sent: ${b.item_name}`,
    layout(
      "We've sent your request",
      `<p>Hi ${esc(b.customer_name)}, ${esc(shopName(b))} will confirm availability, usually within a day.
       You won't be charged until they confirm and you pay.</p>${summary(b)}
       ${(() => {
         const url = bookingStatusUrl(b, base);
         return url
           ? `${button(url, "Check your request status")}
              <p style="color:#737373">Bookmark this link. It shows where your request stands, and becomes your payment page once ${esc(shopName(b))} confirms.</p>`
           : "";
       })()}`
    ),
    CONTACT_EMAIL
  );
}

export async function emailCustomerAccepted(b: Booking, payUrl: string) {
  return send(
    b.customer_email,
    `Confirmed — complete your booking: ${b.item_name}`,
    layout(
      "Your request was accepted",
      `<p>Good news, ${esc(b.customer_name)}: ${esc(shopName(b))} confirmed it's available.
       Pay to lock in your booking.</p>${summary(b)}
       ${button(payUrl, `Pay ${b.total != null ? formatMoney(b.total) : "now"}`)}
       <p style="color:#737373">The item is held for you until you pay or the dates pass.</p>
       <p style="color:#737373;font-size:12px"><strong>Cancellation policy:</strong> ${esc(CANCELLATION_POLICY)}</p>`
    ),
    vendorEmail(b)
  );
}

export async function emailCustomerDeclined(b: Booking) {
  const base = await getSiteUrl();
  return send(
    b.customer_email,
    `Not available: ${b.item_name}`,
    layout(
      "Sorry, this one isn't available",
      `<p>Hi ${esc(b.customer_name)}, ${esc(shopName(b))} can't fulfil this request.</p>${summary(b)}
       ${b.decline_reason ? `<p><strong>Their note:</strong> ${esc(b.decline_reason)}</p>` : ""}
       <p>You haven't been charged.</p>
       ${button(`${base}/`, "Browse similar items")}`
    ),
    vendorEmail(b)
  );
}

/* ---------- Cancellations ---------- */

export async function emailBookingCancelled(
  b: Booking,
  by: "vendor" | "customer" | "admin",
  refund: number,
  reason: string | null,
  wasPaid: boolean
) {
  const base = await getSiteUrl();
  const refundLine = !wasPaid
    ? `<p>No payment was taken, so there's nothing to refund.</p>`
    : refund > 0
      ? `<p>A refund of <strong>${formatMoney(refund)}</strong> is on its way to the original card. It usually arrives in 5–10 business days.</p>`
      : `<p>Under the cancellation policy, this cancellation isn't refundable.</p>`;
  const reasonLine = reason ? `<p><strong>Note:</strong> ${esc(reason)}</p>` : "";

  if (by === "admin") {
    await Promise.all([
      send(
        b.customer_email,
        `Booking cancelled: ${b.item_name}`,
        layout(
          "Your booking was cancelled",
          `<p>Sorry, ${esc(b.customer_name)}: we had to cancel this booking.</p>
           ${summary(b)}${reasonLine}${refundLine}
           ${button(`${base}/`, "Find something similar")}`
        ),
        CONTACT_EMAIL
      ),
      send(
        vendorEmail(b),
        `Booking cancelled by HV Prop Shop: ${b.item_name}`,
        layout(
          "A booking was cancelled",
          `<p>HV Prop Shop cancelled this booking and the dates are free again.</p>${summary(b)}${reasonLine}`
        ),
        CONTACT_EMAIL
      ),
    ]);
    return;
  }

  if (by === "vendor") {
    await send(
      b.customer_email,
      `Booking cancelled: ${b.item_name}`,
      layout(
        "Your booking was cancelled",
        `<p>Sorry, ${esc(b.customer_name)}: ${esc(shopName(b))} had to cancel this booking.</p>
         ${summary(b)}${reasonLine}${refundLine}
         ${button(`${base}/`, "Find something similar")}`
      ),
      vendorEmail(b)
    );
    return;
  }

  await Promise.all([
    send(
      b.customer_email,
      `Cancelled: ${b.item_name}`,
      layout("Your booking is cancelled", `<p>You've cancelled this booking.</p>${summary(b)}${refundLine}`),
      vendorEmail(b)
    ),
    send(
      vendorEmail(b),
      `Customer cancelled: ${b.item_name}`,
      layout(
        "A booking was cancelled",
        `<p>${esc(b.customer_name)} cancelled this booking. The dates are free again.</p>
         ${summary(b)}${reasonLine}
         ${refund > 0 ? `<p>They were refunded ${formatMoney(refund)} under the cancellation policy.</p>` : ""}
         ${button(`${base}/dashboard/requests`, "View requests")}`
      ),
      b.customer_email
    ),
  ]);
}

/* ---------- After payment ---------- */

const pickupPlace = (b: Booking) =>
  [b.prop_id?.user_created?.city, b.prop_id?.user_created?.state].filter(Boolean).join(", ");

export async function emailCustomerBooked(b: Booking) {
  const base = await getSiteUrl();
  const statusUrl = bookingStatusUrl(b, base);
  const place = pickupPlace(b);
  const vendor = vendorEmail(b);
  return send(
    b.customer_email,
    `You're booked: ${b.item_name}`,
    layout(
      "You're booked",
      `<p>Thanks, ${esc(b.customer_name)}. Your booking with ${esc(shopName(b))} is paid and confirmed.</p>
       ${summary(b)}
       <p style="margin-top:16px"><strong>Pickup and return:</strong> arrange times directly with ${esc(shopName(b))}${
         place ? `, in ${esc(place)}` : ""
       }. Reply to this email to reach them${vendor ? `, or write to <a href="mailto:${esc(vendor)}">${esc(vendor)}</a>` : ""}.</p>
       ${statusUrl ? button(statusUrl, "View your booking") : ""}
       <p style="color:#737373;font-size:12px"><strong>Cancellation policy:</strong> ${esc(CANCELLATION_POLICY)}</p>`
    ),
    vendor
  );
}

/* ---------- Unpaid holds ---------- */

export async function emailCustomerPaymentReminder(b: Booking, releaseDate: string) {
  const base = await getSiteUrl();
  const url = bookingStatusUrl(b, base);
  if (!url) return;
  return send(
    b.customer_email,
    `Reminder: complete your booking for ${b.item_name}`,
    layout(
      "Your item is waiting for you",
      `<p>Hi ${esc(b.customer_name)}, ${esc(shopName(b))} is holding this for you, but it isn't booked until you pay.</p>
       ${summary(b)}
       ${button(url, `Pay ${b.total != null ? formatMoney(b.total) : "now"}`)}
       <p style="color:#737373">If you don't pay by ${esc(formatDate(releaseDate))}, the hold is released so others can book it.</p>`
    ),
    vendorEmail(b)
  );
}

export async function emailHoldReleased(b: Booking) {
  const base = await getSiteUrl();
  await Promise.all([
    send(
      b.customer_email,
      `Hold released: ${b.item_name}`,
      layout(
        "Your hold was released",
        `<p>Hi ${esc(b.customer_name)}, we didn't receive payment in time, so ${esc(shopName(b))}'s hold on this item has been released. You haven't been charged.</p>
         ${summary(b)}
         <p>If you still need it, you're welcome to send a new request.</p>
         ${b.prop_id ? button(`${base}/props/${b.prop_id.id}`, "Request it again") : ""}`
      ),
      vendorEmail(b)
    ),
    send(
      vendorEmail(b),
      `Unpaid hold released: ${b.item_name}`,
      layout(
        "An unpaid hold was released",
        `<p>${esc(b.customer_name)} didn't pay within 2 days of you accepting, so the hold was released and the dates are free again.</p>
         ${summary(b)}`
      ),
      b.customer_email
    ),
  ]);
}

/* ---------- Pickup & return reminders ---------- */

export async function emailPickupReminder(b: Booking) {
  const place = pickupPlace(b);
  await Promise.all([
    send(
      b.customer_email,
      `Pickup tomorrow: ${b.item_name}`,
      layout(
        "Pickup is tomorrow",
        `<p>Hi ${esc(b.customer_name)}, a reminder that your rental from ${esc(shopName(b))}${
          place ? ` in ${esc(place)}` : ""
        } starts tomorrow.</p>
         ${summary(b)}
         <p>Reply to this email to confirm a pickup time with them, and check items over when you collect them.</p>`
      ),
      vendorEmail(b)
    ),
    send(
      vendorEmail(b),
      `Pickup tomorrow: ${b.item_name}`,
      layout(
        "Pickup is tomorrow",
        `<p>${esc(b.customer_name)}${b.production ? ` (${esc(b.production)})` : ""} picks up tomorrow.</p>
         ${summary(b)}
         <p>Reply to this email to reach them${b.phone ? `, or call ${esc(b.phone)}` : ""}.</p>`
      ),
      b.customer_email
    ),
  ]);
}

export async function emailReturnReminder(b: Booking) {
  await Promise.all([
    send(
      b.customer_email,
      `Return due tomorrow: ${b.item_name}`,
      layout(
        "Return is due tomorrow",
        `<p>Hi ${esc(b.customer_name)}, your rental from ${esc(shopName(b))} is due back tomorrow.</p>
         ${summary(b)}
         <p>Need more time? Reply to this email and ask ${esc(shopName(b))} before your return date.</p>`
      ),
      vendorEmail(b)
    ),
    send(
      vendorEmail(b),
      `Return due tomorrow: ${b.item_name}`,
      layout(
        "A return is due tomorrow",
        `<p>${esc(b.customer_name)} is due to return this tomorrow.</p>${summary(b)}`
      ),
      b.customer_email
    ),
  ]);
}

/* ---------- Payouts ---------- */

export async function emailVendorPayoutSent(p: {
  to: string | null;
  shop: string;
  item: string;
  dates: string;
  amount: string;
}) {
  const base = await getSiteUrl();
  return send(
    p.to,
    `You've been paid ${p.amount}: ${p.item}`,
    layout(
      "Payout sent",
      `<p>Hi ${esc(p.shop)}, we've sent <strong>${esc(p.amount)}</strong> to your Stripe account for:</p>
       <p>${esc(p.item)}<br><span style="color:#737373">${esc(p.dates)}</span></p>
       <p>Stripe pays it out to your bank on your usual payout schedule.</p>
       ${button(`${base}/dashboard/profile#payouts`, "View payouts")}`
    )
  );
}
