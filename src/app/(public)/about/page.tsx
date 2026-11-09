import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";

export const metadata: Metadata = pageMeta({
  title: "About | HV Prop Shop",
  description:
    "HV Prop Shop connects productions with independent prop and set dressing vendors from the Hudson Valley to New York City.",
  path: "/about",
});

// Copy is a starting point — personalize it with your own story.
export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl! py-12">
      <p className="eyebrow">About</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
        The local prop network, Hudson Valley to NYC.
      </h1>

      <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-neutral-700">
        <p>
          Some of the best props and set dressing in the region aren&apos;t in a big prop house. They&apos;re in
          barns, storefronts and storage units up and down the Hudson Valley, owned by people who collect, restore
          and rent them out to productions.
        </p>
        <p>
          HV Prop Shop brings those independent vendors together in one place, so set decorators, prop masters and
          art departments can find what they need, check it&apos;s available and book it without a dozen phone
          calls.
        </p>
        <p>
          For productions, that means more choice close to set and a simple way to request, pay and keep track of
          everything you&apos;ve pulled. For vendors, it means being found by the people who need what you have,
          with bookings, payments and reminders handled for you.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-medium">Working on a production?</h2>
          <p className="mt-1 text-sm text-neutral-600">Browse inventory from vendors across the region.</p>
          <div className="mt-4 flex gap-2">
            <Link href="/" className="btn-primary h-9!">Browse</Link>
            <Link href="/how-it-works" className="btn-ghost h-9!">How it works</Link>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-medium">Have props to rent?</h2>
          <p className="mt-1 text-sm text-neutral-600">List your inventory and reach productions near you.</p>
          <div className="mt-4">
            <Link href="/sell" className="btn-primary h-9!">List your inventory</Link>
          </div>
        </div>
      </div>

      <p className="mt-10 text-sm text-neutral-600">
        Questions, partnerships or press? <Link href="/contact" className="link">Contact us</Link>.
      </p>
    </div>
  );
}
