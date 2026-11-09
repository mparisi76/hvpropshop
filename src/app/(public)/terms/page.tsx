import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";
import { PLATFORM_FEE_RATE } from "@/lib/policy";

export const metadata: Metadata = {
  title: "Terms of service | HV Prop Shop",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      updated="November 9, 2026"
      current="/terms"
      intro={
        <p>
          These terms apply when you use HV Prop Shop (&ldquo;we&rdquo;, &ldquo;us&rdquo;) at hvpropshop.com,
          whether you&apos;re renting items or listing them. By using the site, sending a request or making a
          booking, you agree to them.
        </p>
      }
    >
      <section>
        <h2>1. What HV Prop Shop is</h2>
        <p>
          HV Prop Shop is a marketplace. Items are listed and rented by independent vendors, not by us. When
          you book, your rental agreement is with the vendor. We provide the platform, take payment on the
          vendor&apos;s behalf and help when something goes wrong, but we don&apos;t own, inspect or guarantee the
          items listed.
        </p>
      </section>

      <section>
        <h2>2. Bookings and payment</h2>
        <ul>
          <li>A request isn&apos;t a booking. A booking is confirmed only after the vendor accepts and you pay.</li>
          <li>You agree to pay the total shown at checkout. Payments are processed by Stripe.</li>
          <li>
            Cancellations and refunds follow our <Link href="/policies#cancellations">rental policies</Link>.
          </li>
          <li>You must be at least 18 and able to enter a binding agreement to book.</li>
        </ul>
      </section>

      <section>
        <h2>3. If you rent</h2>
        <ul>
          <li>Use items with reasonable care and only for lawful purposes.</li>
          <li>Return them on time and in the condition you received them, allowing for normal wear.</li>
          <li>
            You&apos;re responsible for items from pickup until return, including damage, loss or theft, and may
            be charged for repair or replacement.
          </li>
          <li>Follow any additional terms the vendor gives you, such as insurance requirements.</li>
        </ul>
      </section>

      <section>
        <h2>4. If you list items</h2>
        <ul>
          <li>Keep your listings accurate: photos, descriptions, condition, prices and availability.</li>
          <li>Only list items you have the right to rent out.</li>
          <li>Respond to requests promptly and honor bookings you accept.</li>
          <li>Keep your account secure; you&apos;re responsible for activity under it.</li>
          <li>
            <strong>Payments and payouts:</strong> customers pay HV Prop Shop, which collects on your behalf.
            You receive the amount paid minus our {Math.round(PLATFORM_FEE_RATE * 100)}% commission, sent to your
            connected Stripe account the day after the rental&apos;s return date. If a customer cancels and keeps
            part of their payment under our cancellation policy, you receive your share of the part they
            don&apos;t get back. You need a connected Stripe account to accept bookings, and you&apos;re
            responsible for your own taxes on what you earn.
          </li>
          <li>We may edit, hide or remove listings, or suspend accounts, that break these terms.</li>
        </ul>
      </section>

      <section>
        <h2>5. Acceptable use</h2>
        <p>
          Don&apos;t misuse the site: no fraud, spam, scraping, attempts to get around payments, or interfering
          with how the site works. Don&apos;t use contact details from the site for anything other than the
          rental they relate to.
        </p>
      </section>

      <section>
        <h2>6. Content</h2>
        <p>
          Vendors keep ownership of the photos and descriptions they upload, and give us permission to display
          them on the site and in promoting it. The site&apos;s design and our own content belong to us.
        </p>
      </section>

      <section>
        <h2>7. Disclaimers and liability</h2>
        <p>
          The site is provided &ldquo;as is&rdquo;. Because items are provided by independent vendors, we
          aren&apos;t responsible for their condition, safety, legality or suitability, or for vendors&apos; and
          renters&apos; conduct. To the extent the law allows, we aren&apos;t liable for indirect or
          consequential losses, and our total liability for any claim is limited to the fees we received for the
          booking involved.
        </p>
      </section>

      <section>
        <h2>8. Disputes</h2>
        <p>
          If something goes wrong with a rental, contact the vendor first. If you can&apos;t resolve it, email us
          and we&apos;ll try to help. These terms are governed by the laws of the State of New York.
        </p>
      </section>

      <section>
        <h2>9. Changes</h2>
        <p>
          We may update these terms. The &ldquo;last updated&rdquo; date above shows when. Bookings are
          governed by the terms in place when they were made.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </section>
    </LegalPage>
  );
}
