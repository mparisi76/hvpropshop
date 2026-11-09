import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { CalendarCheck, ClipboardList, CreditCard, MessageSquare, Search, Truck } from "lucide-react";
import { CANCELLATION_POLICY } from "@/lib/policy";

export const metadata: Metadata = pageMeta({
  title: "How it works | HV Prop Shop",
  description:
    "Find props and set dressing from independent vendors across the Hudson Valley and NYC, request dates, and book once the vendor confirms.",
  path: "/how-it-works",
});

const STEPS = [
  {
    icon: Search,
    title: "Find what you need",
    body: "Browse by category, search, or filter by pickup location. Every listing shows photos, dimensions, condition and the daily rate.",
  },
  {
    icon: MessageSquare,
    title: "Request your dates",
    body: "Pick your pickup and return dates and send a request. It's free, and nothing is charged yet.",
  },
  {
    icon: CalendarCheck,
    title: "The vendor confirms",
    body: "The vendor checks it's available, usually within a day, and accepts. We hold the item for you.",
  },
  {
    icon: CreditCard,
    title: "Pay to lock it in",
    body: "You get a secure payment link by email. Once you pay, you're booked.",
  },
  {
    icon: Truck,
    title: "Pick up and return",
    body: "Arrange pickup directly with the vendor. We'll remind you the day before pickup and the day before it's due back.",
  },
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Do I need an account?",
    a: "No. Productions can browse, save pull lists and book without signing up. Everything about your booking comes to you by email, including a private link to check its status.",
  },
  {
    q: "When am I charged?",
    a: "Only after the vendor confirms the item is available and you pay through your payment link. Sending a request is free.",
  },
  {
    q: "What if I need to cancel?",
    a: (
      <>
        {CANCELLATION_POLICY} You can cancel from the link in your booking emails, and it shows exactly what
        you&apos;ll get back before you confirm. See the full{" "}
        <Link href="/policies#cancellations">rental policies</Link>.
      </>
    ),
  },
  {
    q: "Can I pay by purchase order or invoice?",
    a: (
      <>
        Yes. Use <strong>Request a quote</strong> on an item&apos;s page and tell us what you need. It&apos;s also
        the way to go if you need to send a certificate of insurance first.
      </>
    ),
  },
  {
    q: "How do pull lists work?",
    a: (
      <>
        Tap the bookmark on any item to add it to your <Link href="/list">pull list</Link>. Name it after your
        production or set, add prep and wrap dates, then share the link with your team, print it, or send it to
        request availability for everything at once.
      </>
    ),
  },
  {
    q: "Where do I pick things up?",
    a: "From the vendor. Each listing shows the vendor's town, and pickup and return times are arranged directly with them. Reply to your booking emails to reach them.",
  },
  {
    q: "What if something gets damaged?",
    a: (
      <>
        Check items over at pickup and tell the vendor about any existing damage. You&apos;re responsible for
        items while you have them, and the vendor may charge for repair or replacement. See{" "}
        <Link href="/policies#damage">care, damage and loss</Link>.
      </>
    ),
  },
  {
    q: "Do you deliver?",
    a: "Some vendors can arrange delivery. Mention it in the notes when you request, and the vendor will let you know.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="container-page py-10 md:py-14">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">How it works</h1>
          <p className="mt-3 max-w-2xl text-neutral-600">
            Rent props and set dressing straight from independent vendors across the Hudson Valley and New York
            City. Request your dates, the vendor confirms, and you only pay once it&apos;s yours.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/" className="btn-primary">Browse inventory</Link>
            <Link href="/sell" className="btn-secondary">List your inventory</Link>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="text-xl font-semibold tracking-tight">Booking, step by step</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card p-5">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-neutral-900 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <s.icon className="h-5 w-5 text-neutral-500" aria-hidden />
              </div>
              <h3 className="mt-3 font-medium">{s.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5 sm:flex-row sm:items-center">
          <ClipboardList className="h-8 w-8 shrink-0 text-neutral-500" aria-hidden />
          <div className="flex-1">
            <h3 className="font-medium">Dressing a whole set?</h3>
            <p className="text-sm text-neutral-600">
              Build a pull list as you browse, share it with your designer, and request availability for every
              item in one go.
            </p>
          </div>
          <Link href="/list" className="btn-secondary">Open pull list</Link>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="container-page max-w-3xl! py-12">
          <h2 className="text-xl font-semibold tracking-tight">Questions</h2>
          <div className="mt-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-neutral-400 transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <div className="mt-2 text-sm leading-relaxed text-neutral-700 [&_a]:underline [&_a]:underline-offset-2">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm text-neutral-600">
            Still stuck? <Link href="/contact" className="link">Get in touch</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
