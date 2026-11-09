import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { Mail } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site";
import ContactForm from "./ContactForm";

export const metadata: Metadata = pageMeta({
  title: "Contact | HV Prop Shop",
  description:
    "Get in touch with HV Prop Shop about bookings, listing your inventory, partnerships or press.",
  path: "/contact",
});

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return (
    <div className="container-page max-w-4xl! py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Contact us</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_16rem]">
        <ContactForm defaultTopic={topic} />
        <aside className="space-y-6 text-sm text-neutral-600">
          <div>
            <h2 className="font-medium text-neutral-900">About a booking?</h2>
            <p className="mt-1">
              Reply to any of your booking emails to reach the vendor directly. That&apos;s usually fastest.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-neutral-900">Common questions</h2>
            <p className="mt-1">
              See <Link href="/how-it-works" className="link">How it works</Link> and our{" "}
              <Link href="/policies" className="link">rental policies</Link>.
            </p>
          </div>
          <div>
            <h2 className="font-medium text-neutral-900">Email</h2>
            <a href={`mailto:${CONTACT_EMAIL}`} className="mt-1 flex items-center gap-1.5 hover:text-neutral-900">
              <Mail className="h-4 w-4" aria-hidden /> {CONTACT_EMAIL}
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
