import Link from "next/link";
import Stripe from "stripe";
import directus from "@/lib/directus";
import { readItem } from "@directus/sdk";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string }>;
}) {
  const { session_id } = await searchParams;

  // 1. Get the session details from Stripe
  const session = await stripe.checkout.sessions.retrieve(session_id);
  const inquiryId = session.metadata?.inquiry_id;

	

  // 2. Get the Prop details from Directus via the Inquiry
  let propName = "your rental";
  if (inquiryId) {
    const inquiry = await directus.request(
      readItem("inquiries", inquiryId, {
        fields: ["*", { prop_id: ["title"] }],
      })
    );
    propName = inquiry?.item_name || "your rental";
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-green-100">
        <div className="text-64px mb-4">✅</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Received!
        </h1>
        <p className="text-gray-600 mb-6">
          Thanks,{" "}
          <span className="font-semibold text-gray-800">
            {session.customer_details?.name}
          </span>
          ! Your booking for <span className="italic">&ldquo;{propName}&rdquo;</span> is
          officially confirmed.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-8 text-sm text-left">
          <p className="text-gray-500 uppercase tracking-wider font-bold text-xs mb-2">
            Order Summary
          </p>
          <div className="flex justify-between mb-1">
            <span>Amount Paid:</span>
            <span className="font-mono">
              ${(session.amount_total || 0) / 100}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Receipt Email:</span>
            <span>{session.customer_details?.email}</span>
          </div>
        </div>

        <Link
          href="/"
          className="inline-block bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
        >
          Return to Gallery
        </Link>
      </div>
    </div>
  );
}
