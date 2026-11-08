import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy | HV Prop Shop",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="November 8, 2026"
      current="/privacy"
      intro={<p>What we collect, why, and who we share it with.</p>}
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>When you send a request or book:</strong> your name, email, optional phone number and
            production or company name, your dates, and any notes you add.
          </li>
          <li>
            <strong>Payments:</strong> handled by Stripe. We receive confirmation that you paid and the amount,
            not your full card details.
          </li>
          <li>
            <strong>Vendor accounts:</strong> name, email, phone, shop details, profile photo, logo and listings.
          </li>
          <li>
            <strong>Basic technical data</strong> our hosting providers record automatically, such as IP address
            and browser type, to keep the site running and secure.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To pass your request to the vendor and manage your booking, payment and any refunds.</li>
          <li>To send emails about your request or booking.</li>
          <li>To run, secure and improve the site.</li>
        </ul>
        <p>We don&apos;t sell your information, and we don&apos;t send marketing emails without your permission.</p>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <ul>
          <li>
            <strong>The vendor</strong> you&apos;re requesting from or booking with, so they can confirm and
            arrange your rental.
          </li>
          <li>
            <strong>Service providers</strong> who run parts of the site for us: Stripe (payments), Resend
            (email) and our hosting and database providers. They only use it to provide their service.
          </li>
          <li>Authorities, if the law requires it.</li>
        </ul>
        <p>Vendors&apos; email addresses and phone numbers aren&apos;t shown publicly.</p>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p>
          We use a small number of cookies to keep vendors logged in. Your pull list is saved in your own
          browser (local storage) and isn&apos;t sent to us unless you share it or request availability. We
          don&apos;t use advertising cookies.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep booking records as long as needed for the rental, refunds, disputes and our legal and tax
          obligations. Vendors can ask us to delete their account.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can ask to see, correct or delete the personal information we hold about you by emailing{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Some records, such as completed payments, we
          may need to keep by law.
        </p>
      </section>
    </LegalPage>
  );
}
