import type { Metadata } from "next";
import Link from "next/link";
import { BadgeDollarSign, Bell, CalendarCheck, Camera } from "lucide-react";
import { PLATFORM_FEE_RATE } from "@/lib/policy";
import ApplyForm from "./ApplyForm";

export const metadata: Metadata = {
  title: "List your inventory | HV Prop Shop",
  description:
    "Rent your props and set dressing to productions across the Hudson Valley and NYC. You approve every booking and get paid automatically.",
};

const fee = Math.round(PLATFORM_FEE_RATE * 100);

const BENEFITS = [
  { icon: Camera, title: "List in minutes", body: "Add photos, a daily rate and quantity. Your listings appear in search and on your own vendor page." },
  { icon: CalendarCheck, title: "You approve every booking", body: "Productions request dates; you accept or decline. Block dates when items are rented elsewhere." },
  { icon: BadgeDollarSign, title: "Get paid automatically", body: `Customers pay online. You receive ${100 - fee}% of each booking in your bank account after the return date.` },
  { icon: Bell, title: "We handle the admin", body: "Payment links, reminders, receipts and cancellations are taken care of, so you can focus on your inventory." },
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  { q: "What does it cost?", a: `Nothing to list. We take a ${fee}% commission on bookings, and that's it: no monthly fees.` },
  {
    q: "How do I get paid?",
    a: "Through Stripe. Once you're approved, you connect a Stripe account (it takes a few minutes), and each booking's payout is sent to it the day after the return date.",
  },
  {
    q: "Who handles pickup and return?",
    a: "You do, directly with the production. Customers reply to their booking emails to reach you, and we send everyone reminders the day before.",
  },
  {
    q: "What if a customer cancels?",
    a: (
      <>
        Cancellations follow our <Link href="/policies#cancellations">rental policies</Link>. If a customer cancels
        close to pickup and keeps part of their payment, you get your share of it.
      </>
    ),
  },
  { q: "Can I still rent items elsewhere?", a: "Of course. Block the dates on your listing whenever something is out on another job, so it can't be requested here." },
];

export default function SellPage() {
  return (
    <>
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="container-page py-12 md:py-16">
          <p className="eyebrow">For vendors</p>
          <h1 className="mt-1 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Rent your props to productions across the Hudson Valley and NYC.
          </h1>
          <p className="mt-3 max-w-2xl text-neutral-600">
            List your inventory, approve the bookings you want, and get paid automatically. No monthly fees, just a{" "}
            {fee}% commission when you rent.
          </p>
          <a href="#apply" className="btn-accent mt-6">Apply to list</a>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="card p-5">
              <b.icon className="h-6 w-6 text-neutral-500" aria-hidden />
              <h2 className="mt-3 font-medium">{b.title}</h2>
              <p className="mt-1 text-sm text-neutral-600">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_22rem]">
          <div id="apply" className="scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight">Apply to list</h2>
            <p className="mb-6 mt-1 text-sm text-neutral-600">
              Tell us about your inventory. We review every application and usually reply within a few days.
            </p>
            <ApplyForm />
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight">Questions</h2>
            <div className="mt-4 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
              {FAQ.map((f) => (
                <details key={f.q} className="group px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="text-neutral-400 transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <div className="mt-2 text-sm text-neutral-700 [&_a]:underline [&_a]:underline-offset-2">{f.a}</div>
                </details>
              ))}
            </div>
            <p className="mt-4 text-sm text-neutral-600">
              Already a vendor? <Link href="/login" className="link">Log in</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
