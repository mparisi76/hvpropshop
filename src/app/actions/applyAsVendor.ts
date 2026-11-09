"use server";

import { createItem } from "@directus/sdk";
import { Resend } from "resend";
import { asServer } from "@/lib/serverDirectus";
import { CONTACT_EMAIL } from "@/lib/site";
import { getSiteUrl } from "@/lib/baseUrl";
import { reportError } from "@/lib/alerts";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "HV Prop Shop <onboarding@hvpropshop.com>";

export type ApplyState = { success?: boolean; error?: string; values?: Record<string, string> } | null;

const FIELDS = ["name", "email", "phone", "shop_name", "city", "state", "inventory", "item_count", "website", "message"] as const;
const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max);
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function applyAsVendor(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const values = Object.fromEntries(
    FIELDS.map((f) => [f, clean(formData.get(f), f === "message" || f === "inventory" ? 2000 : 200)])
  ) as Record<(typeof FIELDS)[number], string>;
  values.state = values.state.toUpperCase().slice(0, 2);

  if (clean(formData.get("website_url"))) return { success: true }; // honeypot
  if (!values.name) return { error: "Please enter your name.", values };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return { error: "Please enter a valid email address.", values };
  if (!values.shop_name) return { error: "Please enter your shop or business name.", values };
  if (!values.city) return { error: "Please enter where your inventory is.", values };
  if (!values.inventory) return { error: "Tell us a little about what you rent.", values };

  // 1. Save (if the collection exists) — the email below still goes out either way
  let saved = false;
  try {
    await asServer(createItem("vendor_applications", { ...values, status: "new" }));
    saved = true;
  } catch (error) {
    console.error('[apply] Application not saved (does the "vendor_applications" collection exist?):', error);
  }

  // 2. Notify HV Prop Shop, 3. confirm to the applicant
  const base = await getSiteUrl();
  const row = (k: string, v: string) =>
    v ? `<tr><td style="padding:3px 16px 3px 0;color:#737373;vertical-align:top">${k}</td><td style="padding:3px 0;white-space:pre-wrap">${esc(v)}</td></tr>` : "";
  const results = await Promise.allSettled([
    resend.emails.send({
      from: FROM,
      to: CONTACT_EMAIL,
      replyTo: values.email,
      subject: `Vendor application: ${values.shop_name}`,
      html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;color:#171717">
        <h2 style="font-size:18px">New vendor application</h2>
        <table style="border-collapse:collapse">
          ${row("Name", values.name)}${row("Email", values.email)}${row("Phone", values.phone)}
          ${row("Shop", values.shop_name)}${row("Location", [values.city, values.state].filter(Boolean).join(", "))}
          ${row("Inventory", values.inventory)}${row("Size", values.item_count)}${row("Website", values.website)}
          ${row("Notes", values.message)}
        </table>
        ${saved ? `<p><a href="${base}/admin/applications">Review in the admin dashboard</a></p>` : `<p style="color:#b45309">Not saved to Directus.</p>`}
      </div>`,
    }),
    resend.emails.send({
      from: FROM,
      to: values.email,
      replyTo: CONTACT_EMAIL,
      subject: "We got your application",
      html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.5;color:#171717;max-width:560px">
        <h2 style="font-size:18px">Thanks for applying, ${esc(values.name.split(" ")[0])}</h2>
        <p>We'll take a look at ${esc(values.shop_name)} and get back to you, usually within a few days.
        If you're approved, you'll get an email to set up your account.</p>
        <p>Questions in the meantime? Just reply to this email.</p>
      </div>`,
    }),
  ]);
  const adminEmailed = results[0].status === "fulfilled" && !results[0].value.error;
  if (!adminEmailed) {
    await reportError(
      "Vendor application email failed",
      results[0].status === "rejected" ? results[0].reason : results[0].value.error,
      { shop: values.shop_name, email: values.email, savedToDirectus: saved }
    );
  }

  if (!saved && !adminEmailed) {
    return { error: `We couldn't send your application. Please email ${CONTACT_EMAIL} instead.`, values };
  }
  return { success: true };
}
