import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { getSiteUrl } from "@/lib/baseUrl";
import { stripe } from "@/lib/payments";
import { getVendorStripeAccountId } from "@/lib/payouts";

/** Open the vendor's Stripe Express dashboard (balances, payouts, bank details). */
export async function GET() {
  const base = await getSiteUrl();
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${base}/login?next=/dashboard/profile`);

  const accountId = await getVendorStripeAccountId(user.id);
  if (!accountId) return NextResponse.redirect(`${base}/dashboard/payouts/connect`);

  try {
    const login = await stripe.accounts.createLoginLink(accountId);
    return NextResponse.redirect(login.url);
  } catch (error) {
    // Usually means onboarding isn't finished yet
    console.warn("[payouts] Couldn't open Stripe dashboard:", error);
    return NextResponse.redirect(`${base}/dashboard/payouts/connect`);
  }
}
