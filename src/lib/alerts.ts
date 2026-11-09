import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Error alerts: logs the error and emails the site owner (ALERT_EMAIL, or the
 * contact address). Throttled so the same problem emails at most once every
 * 15 minutes per server. Only emails in production (set ALERTS_IN_DEV=1 to test).
 */

const THROTTLE_MS = 15 * 60 * 1000;
const lastSent = new Map<string, number>();
const resend = new Resend(process.env.RESEND_API_KEY);

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A readable message from Directus, Stripe, or plain errors. */
export function errorMessage(error: unknown): string {
  const e = error as {
    errors?: { message?: string; extensions?: { code?: string } }[];
    type?: string;
    code?: string;
    message?: string;
  };
  if (e?.errors?.[0]?.message) {
    const code = e.errors[0].extensions?.code;
    return `Directus${code ? ` (${code})` : ""}: ${e.errors[0].message}`;
  }
  if (e?.type?.startsWith?.("Stripe")) return `Stripe ${e.type}${e.code ? ` (${e.code})` : ""}: ${e.message}`;
  if (e?.message) return e.message;
  try {
    return JSON.stringify(error).slice(0, 500);
  } catch {
    return String(error);
  }
}

export async function reportError(where: string, error: unknown, details?: Record<string, unknown>) {
  const message = errorMessage(error);
  console.error(`[alert] ${where}: ${message}`, details ?? "", error);

  if (process.env.NODE_ENV !== "production" && !process.env.ALERTS_IN_DEV) return;
  if (!process.env.RESEND_API_KEY) return;

  const key = `${where}|${message}`.slice(0, 300);
  const now = Date.now();
  if (now - (lastSent.get(key) ?? 0) < THROTTLE_MS) return;
  lastSent.set(key, now);

  const stack = error instanceof Error && error.stack ? error.stack.split("\n").slice(0, 8).join("\n") : "";
  const rows = Object.entries(details ?? {})
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:2px 12px 2px 0;color:#737373">${esc(k)}</td><td style="padding:2px 0">${esc(
          typeof v === "string" ? v : JSON.stringify(v)
        )}</td></tr>`
    )
    .join("");

  try {
    await resend.emails.send({
      from: "HV Prop Shop alerts <onboarding@hvpropshop.com>",
      to: process.env.ALERT_EMAIL || CONTACT_EMAIL,
      subject: `⚠️ ${where}`.slice(0, 150),
      html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;color:#171717">
        <p style="font-weight:600;margin:0 0 8px">${esc(where)}</p>
        <p style="margin:0 0 12px">${esc(message)}</p>
        ${rows ? `<table style="border-collapse:collapse;margin-bottom:12px">${rows}</table>` : ""}
        ${stack ? `<pre style="font-size:12px;background:#f5f5f5;padding:10px;border-radius:6px;white-space:pre-wrap">${esc(stack)}</pre>` : ""}
        <p style="color:#737373;font-size:12px">${new Date().toISOString()} · Repeats of this alert are muted for 15 minutes. Full details are in the server logs.</p>
      </div>`,
    });
  } catch (sendError) {
    // Never let alerting itself break anything
    console.error("[alert] Couldn't send alert email:", sendError);
  }
}
