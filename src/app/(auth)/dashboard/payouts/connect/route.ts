import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { getSiteUrl } from "@/lib/baseUrl";
import { stripe } from "@/lib/payments";
import { getVendorStripeAccountId, setVendorStripeAccountId } from "@/lib/payouts";

/**
 * Start or resume Stripe Connect onboarding for the logged-in vendor.
 * Creates their Stripe Express account the first time, then sends them to
 * Stripe's hosted setup. Stripe sends them back to the Shop page when done.
 */
export async function GET() {
  const base = await getSiteUrl();
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${base}/login?next=/dashboard/profile`);

  try {
    let accountId = await getVendorStripeAccountId(user.id);
    if (!accountId) {
      // Stripe rejects localhost / non-https URLs for a business website
      const publicSite = base.startsWith("https://") && !base.includes("localhost");

      let account;
      try {
        account = await stripe.accounts.create({
          type: "express",
          country: "US",
          email: user.email ?? undefined,
          capabilities: { transfers: { requested: true } },
          business_profile: {
            name: user.shop_name ?? undefined,
            product_description: "Prop and set dressing rentals for film, TV and photo",
            ...(publicSite ? { url: `${base}/vendors/${user.id}` } : {}),
          },
          metadata: { directus_user_id: user.id },
        });
      } catch (error) {
        console.error(
          "[payouts] Stripe refused to create the account. Is Connect enabled for this Stripe mode (test/live)?",
          stripeMessage(error)
        );
        throw error;
      }

      try {
        await setVendorStripeAccountId(user.id, account.id);
      } catch (error) {
        // Don't leave an orphaned Stripe account behind on every click
        console.error(
          '[payouts] Created Stripe account but couldn\'t save it. Does the Site server policy allow Update on directus_users.stripe_account_id?',
          error
        );
        await stripe.accounts.del(account.id).catch(() => {});
        throw error;
      }
      accountId = account.id;
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${base}/dashboard/payouts/connect`,
      return_url: `${base}/dashboard/profile?payouts=updated#payouts`,
    });
    return NextResponse.redirect(link.url);
  } catch (error) {
    console.error("[payouts] Couldn't start Stripe onboarding:", stripeMessage(error));
    return NextResponse.redirect(`${base}/dashboard/profile?payouts=error#payouts`);
  }
}

/** Stripe's own explanation, when there is one. */
function stripeMessage(error: unknown) {
  const e = error as { type?: string; code?: string; message?: string };
  return e?.message ? `${e.type ?? "error"}${e.code ? ` (${e.code})` : ""}: ${e.message}` : error;
}
