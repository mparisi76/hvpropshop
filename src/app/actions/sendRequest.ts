"use server";

import { Resend } from "resend";
import { createItem } from "@directus/sdk";
import directus from "@/lib/directus";
import { getPublishedPropsByIds } from "@/lib/props";
import { vendorLocation, vendorName } from "@/lib/vendors";
import { CONTACT_EMAIL } from "@/lib/site";
import { getSiteUrl } from "@/lib/baseUrl";
import { reportError } from "@/lib/alerts";

const resend = new Resend(process.env.RESEND_API_KEY);

export type RequestType = "pull_list" | "quote";

export type RequestState = {
  success?: boolean;
  error?: string;
  /** Echo of submitted values so the form can repopulate after React resets it */
  values?: Record<string, string>;
  email?: string;
} | null;

const FIELDS = ["name", "email", "phone", "production", "start_date", "end_date", "message", "quantity"] as const;

const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max);

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export async function sendRequest(_prev: RequestState, formData: FormData): Promise<RequestState> {
  const values = Object.fromEntries(
    FIELDS.map((f) => [f, clean(formData.get(f), f === "message" ? 2000 : 200)])
  ) as Record<(typeof FIELDS)[number], string>;

  // Honeypot: real users never see or fill this field
  if (clean(formData.get("website_url"))) return { success: true, email: values.email };

  const type: RequestType = formData.get("type") === "quote" ? "quote" : "pull_list";
  const ids = clean(formData.get("item_ids"), 5000).split(",").filter(Boolean);

  const fail = (error: string): RequestState => ({ error, values });

  if (!values.name) return fail("Please enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return fail("Please enter a valid email address.");
  if (values.start_date && !isDate(values.start_date)) return fail("Please check the start date.");
  if (values.end_date && !isDate(values.end_date)) return fail("Please check the end date.");
  if (values.start_date && values.end_date && values.end_date < values.start_date) {
    return fail("The end date is before the start date.");
  }

  // Look items up server-side so names/prices/vendors can't be spoofed
  let items;
  try {
    items = await getPublishedPropsByIds(ids);
  } catch (error) {
    console.error("Request item lookup failed:", error);
    return fail("Something went wrong. Please try again.");
  }
  if (items.length === 0) return fail("None of these items are available anymore.");

  const quantity = type === "quote" ? Math.max(1, parseInt(values.quantity) || 1) : null;
  const siteUrl = await getSiteUrl();
  const itemSummary = items.map((i) => ({
    id: i.id,
    name: i.name,
    price: i.price,
    vendor_id: i.user_created?.id ?? null,
    vendor: vendorName(i.user_created),
    vendor_location: vendorLocation(i.user_created),
  }));

  // Group by vendor — used for both the Directus record and the email
  const byVendor = new Map<string, typeof itemSummary>();
  for (const i of itemSummary) {
    const key = `${i.vendor}${i.vendor_location ? ` (${i.vendor_location})` : ""}`;
    byVendor.set(key, [...(byVendor.get(key) ?? []), i]);
  }

  // Plain-text item list, readable straight from the Directus record
  const itemsText = [...byVendor.entries()]
    .map(([vendor, list]) =>
      [
        vendor,
        ...list.map(
          (i) => `  • ${i.name} — $${Number(i.price || 0).toLocaleString()}/day — ${siteUrl}/props/${i.id}`
        ),
      ].join("\n")
    )
    .join("\n\n");

  /* 1. Save to Directus */
  let saved = false;
  try {
    await directus.request(
      createItem("requests", {
        type,
        name: values.name,
        email: values.email,
        phone: values.phone || null,
        production: values.production || null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        quantity,
        message: values.message || null,
        items: itemsText,
      })
    );
    saved = true;
  } catch (error) {
    await reportError("Pull-list/quote request not saved to Directus", error, { customer: values.email });
  }

  /* 2. Email HV Prop Shop */
  let emailed = false;
  try {
    const title = type === "quote" ? "Quote request" : "Pull list availability request";
    const row = (label: string, value: string) =>
      value
        ? `<tr><td style="padding:4px 12px 4px 0;color:#737373;vertical-align:top">${label}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`
        : "";

    const html = `
      <div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;color:#171717;max-width:600px">
        <h2 style="font-size:18px;margin:0 0 16px">${title}</h2>
        <table style="border-collapse:collapse;margin-bottom:20px">
          ${row("Name", values.name)}
          ${row("Email", values.email)}
          ${row("Phone", values.phone)}
          ${row("Production", values.production)}
          ${row("Dates", [values.start_date, values.end_date].filter(Boolean).join(" → "))}
          ${quantity ? row("Quantity", String(quantity)) : ""}
        </table>
        ${[...byVendor.entries()]
          .map(
            ([vendor, list]) => `
          <p style="margin:16px 0 4px;font-weight:600">${escapeHtml(vendor)}</p>
          <ul style="margin:0;padding-left:18px">
            ${list
              .map(
                (i) =>
                  `<li><a href="${siteUrl}/props/${encodeURIComponent(String(i.id))}">${escapeHtml(i.name)}</a> — $${Number(i.price || 0).toLocaleString()}/day</li>`
              )
              .join("")}
          </ul>`
          )
          .join("")}
        ${
          values.message
            ? `<p style="margin:20px 0 4px;font-weight:600">Notes</p><p style="margin:0;white-space:pre-wrap">${escapeHtml(values.message)}</p>`
            : ""
        }
        ${saved ? "" : `<p style="margin-top:24px;color:#b45309">Note: this request could not be saved to Directus.</p>`}
      </div>`;

    const { error } = await resend.emails.send({
      from: "HV Prop Shop <onboarding@hvpropshop.com>",
      to: CONTACT_EMAIL,
      replyTo: values.email,
      subject: `${title}: ${values.production || values.name} (${items.length} ${items.length === 1 ? "item" : "items"})`,
      html,
    });
    if (error) await reportError("Pull-list/quote request email failed", error, { customer: values.email });
    else emailed = true;
  } catch (error) {
    await reportError("Pull-list/quote request email failed", error, { customer: values.email });
  }

  if (!saved && !emailed) return fail("We couldn't send your request. Please try again or email us directly.");
  return { success: true, email: values.email };
}
