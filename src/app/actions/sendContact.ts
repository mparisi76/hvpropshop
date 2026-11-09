"use server";

import { Resend } from "resend";
import { CONTACT_EMAIL } from "@/lib/site";

const resend = new Resend(process.env.RESEND_API_KEY);

export type ContactState = {
  success?: boolean;
  error?: string;
  values?: Record<string, string>;
} | null;

const TOPICS = ["Booking question", "Listing my inventory", "Partnerships or press", "Something else"];
const clean = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max);
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values = {
    name: clean(formData.get("name"), 120),
    email: clean(formData.get("email"), 200),
    topic: TOPICS.includes(clean(formData.get("topic"))) ? clean(formData.get("topic")) : TOPICS[3],
    message: clean(formData.get("message"), 5000),
  };
  if (clean(formData.get("website_url"))) return { success: true }; // honeypot

  if (!values.name) return { error: "Please enter your name.", values };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return { error: "Please enter a valid email address.", values };
  if (values.message.length < 5) return { error: "Please write a message.", values };

  try {
    const { error } = await resend.emails.send({
      from: "HV Prop Shop <onboarding@hvpropshop.com>",
      to: CONTACT_EMAIL,
      replyTo: values.email,
      subject: `[${values.topic}] ${values.name}`,
      html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:14px;color:#171717">
        <p><strong>${esc(values.name)}</strong> &lt;${esc(values.email)}&gt; · ${esc(values.topic)}</p>
        <p style="white-space:pre-wrap">${esc(values.message)}</p>
      </div>`,
    });
    if (error) throw error;
  } catch (error) {
    console.error("Contact form error:", error);
    return { error: `We couldn't send your message. Please email ${CONTACT_EMAIL} instead.`, values };
  }
  return { success: true };
}
