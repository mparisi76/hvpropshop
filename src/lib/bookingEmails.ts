import { Resend } from "resend";
import { CONTACT_EMAIL, siteUrl } from "@/lib/site";
import { formatDate, formatMoney, type Booking } from "@/lib/bookings";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "HV Prop Shop <onboarding@hvpropshop.com>";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.5;color:#171717;max-width:560px">
  <h2 style="font-size:18px;margin:0 0 16px">${esc(title)}</h2>
  ${body}
  <p style="margin-top:32px;color:#737373;font-size:12px">HV Prop Shop · Props and set dressing, Hudson Valley to NYC</p>
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
const shopName = (b: Booking) =>
  b.prop_id?.user_created?.shop_name || b.prop_id?.user_created?.first_name || "the vendor";

/* ---------- To the vendor ---------- */

export function emailVendorNewRequest(b: Booking) {
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
       ${button(`${siteUrl()}/dashboard/requests`, "Accept or decline")}`
    ),
    b.customer_email
  );
}

export function emailVendorPaid(b: Booking) {
  return send(
    vendorEmail(b),
    `Booked and paid: ${b.item_name}`,
    layout(
      "Booking confirmed and paid",
      `<p>${esc(b.customer_name)} has paid for:</p>${summary(b)}
       <p>Reply to this email to reach them about pickup and return.</p>
       ${button(`${siteUrl()}/dashboard/requests`, "View booking")}`
    ),
    b.customer_email
  );
}

/* ---------- To the customer ---------- */

export function emailCustomerRequestReceived(b: Booking) {
  return send(
    b.customer_email,
    `Request sent: ${b.item_name}`,
    layout(
      "We've sent your request",
      `<p>Hi ${esc(b.customer_name)}, ${esc(shopName(b))} will confirm availability, usually within a day.
       You won't be charged until they confirm and you pay.</p>${summary(b)}`
    ),
    CONTACT_EMAIL
  );
}

export function emailCustomerAccepted(b: Booking, payUrl: string) {
  return send(
    b.customer_email,
    `Confirmed — complete your booking: ${b.item_name}`,
    layout(
      "Your request was accepted",
      `<p>Good news, ${esc(b.customer_name)}: ${esc(shopName(b))} confirmed it's available.
       Pay to lock in your booking.</p>${summary(b)}
       ${button(payUrl, `Pay ${b.total != null ? formatMoney(b.total) : "now"}`)}
       <p style="color:#737373">The item is held for you until you pay or the dates pass.</p>`
    ),
    vendorEmail(b)
  );
}

export function emailCustomerDeclined(b: Booking) {
  return send(
    b.customer_email,
    `Not available: ${b.item_name}`,
    layout(
      "Sorry, this one isn't available",
      `<p>Hi ${esc(b.customer_name)}, ${esc(shopName(b))} can't fulfil this request.</p>${summary(b)}
       ${b.decline_reason ? `<p><strong>Their note:</strong> ${esc(b.decline_reason)}</p>` : ""}
       <p>You haven't been charged.</p>
       ${button(`${siteUrl()}/`, "Browse similar items")}`
    ),
    vendorEmail(b)
  );
}
