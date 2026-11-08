import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { CANCELLATION_POLICY } from "@/lib/policy";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Rental policies | HV Prop Shop",
  description: "How booking, payment, cancellations and refunds work on HV Prop Shop.",
};

export default function PoliciesPage() {
  return (
    <LegalPage
      title="Rental policies"
      updated="November 8, 2026"
      current="/policies"
      intro={
        <p>
          HV Prop Shop connects productions with independent prop and set dressing vendors. Here&apos;s how
          renting works, in plain language. These policies are part of our{" "}
          <Link href="/terms">Terms of Service</Link>.
        </p>
      }
    >
      <section id="booking">
        <h2>How booking works</h2>
        <ul>
          <li>
            <strong>Request.</strong> Choose your pickup and return dates and send a request. Nothing is
            charged at this point.
          </li>
          <li>
            <strong>Vendor confirms.</strong> The vendor checks availability and accepts or declines, usually
            within a day. We email you either way.
          </li>
          <li>
            <strong>Pay to confirm.</strong> Once accepted, you&apos;ll get a private link to pay. The item is
            held for you until you pay or your dates pass. Your booking is confirmed once payment goes through.
          </li>
        </ul>
        <p>
          The link in your emails always shows your booking&apos;s current status. Keep it handy: it&apos;s also
          where you pay and, if needed, cancel.
        </p>
      </section>

      <section id="pricing">
        <h2>Pricing and payment</h2>
        <ul>
          <li>Prices are a daily rate per item. Rental days count both the pickup and return days.</li>
          <li>The total is shown before you pay and is charged in full when you confirm.</li>
          <li>Payments are processed securely by Stripe. We never see or store your full card number.</li>
        </ul>
      </section>

      <section id="cancellations">
        <h2>Cancellations and refunds</h2>
        <p>
          <strong>If you cancel:</strong> {CANCELLATION_POLICY}
        </p>
        <ul>
          <li>3 or more days before pickup: full refund.</li>
          <li>1–2 days before pickup: 50% refund.</li>
          <li>On or after the pickup day: no refund.</li>
          <li>Requests you haven&apos;t paid for yet can be cancelled at any time at no cost.</li>
        </ul>
        <p>
          You can cancel from the link in your booking emails, which shows exactly what you&apos;ll be refunded
          before you confirm.
        </p>
        <p>
          <strong>If the vendor cancels</strong> a confirmed booking, you get a full refund.
        </p>
        <p>
          Refunds go back to the original card and usually arrive within 5–10 business days, depending on your
          bank.
        </p>
      </section>

      <section id="pickup">
        <h2>Pickup and return</h2>
        <ul>
          <li>
            Pickup and return times and locations are arranged directly with the vendor. Reply to the email
            confirming your request was accepted and it goes straight to them.
          </li>
          <li>Please return items on your return date, in the condition you received them.</li>
          <li>
            Late returns can affect the vendor&apos;s next booking. If you need more time, contact the vendor
            before your return date. The vendor may charge for extra days.
          </li>
        </ul>
      </section>

      <section id="damage">
        <h2>Care, damage and loss</h2>
        <ul>
          <li>You&apos;re responsible for items from pickup until they&apos;re returned to the vendor.</li>
          <li>
            Check items at pickup and tell the vendor about any existing damage right away, ideally with photos.
          </li>
          <li>
            If an item is damaged, lost or not returned, the vendor may charge for repair or replacement. Some
            vendors have their own additional terms, which they&apos;ll share with you.
          </li>
        </ul>
      </section>

      <section id="insurance">
        <h2>Insurance certificates</h2>
        <p>
          Some vendors require a certificate of insurance (COI) before pickup. If you need to provide one, or
          you&apos;re paying by purchase order, use <strong>Request a quote</strong> on the item&apos;s page and
          we&apos;ll help sort out the details.
        </p>
      </section>

      <section id="contact">
        <h2>Questions</h2>
        <p>
          Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we&apos;ll help.
        </p>
      </section>
    </LegalPage>
  );
}
