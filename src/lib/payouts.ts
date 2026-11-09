import { readItems, readUser, updateItem, updateUser } from "@directus/sdk";
import { asServer } from "@/lib/serverDirectus";
import { stripe } from "@/lib/payments";
import { PLATFORM_FEE_RATE, vendorShare } from "@/lib/policy";
import { formatDate, formatMoney, todayIso } from "@/lib/bookings";
import { emailVendorPayoutSent } from "@/lib/bookingEmails";

export { PLATFORM_FEE_RATE, vendorShare };

/* ---------- Vendor Stripe accounts (directus_users.stripe_account_id) ---------- */

export async function getVendorStripeAccountId(vendorId: string) {
  try {
    const user = (await asServer(readUser(vendorId, { fields: ["stripe_account_id"] }))) as unknown as {
      stripe_account_id: string | null;
    };
    return user?.stripe_account_id ?? null;
  } catch (error) {
    console.warn(`[payouts] Couldn't read stripe_account_id for ${vendorId}:`, error);
    return null;
  }
}

export async function setVendorStripeAccountId(vendorId: string, accountId: string) {
  await asServer(
    updateUser(vendorId, { stripe_account_id: accountId } as unknown as Parameters<typeof updateUser>[1])
  );
}

export interface PayoutAccountStatus {
  /** Has started Stripe setup */
  connected: boolean;
  /** Can receive payouts (transfers capability active) */
  ready: boolean;
  /** Stripe still needs information from them */
  needsInfo: boolean;
  accountId: string | null;
}

export async function getPayoutAccountStatus(vendorId: string): Promise<PayoutAccountStatus> {
  const accountId = await getVendorStripeAccountId(vendorId);
  if (!accountId) return { connected: false, ready: false, needsInfo: true, accountId: null };
  try {
    const account = await stripe.accounts.retrieve(accountId);
    const ready = account.capabilities?.transfers === "active";
    const needsInfo = !account.details_submitted || (account.requirements?.currently_due?.length ?? 0) > 0;
    return { connected: true, ready, needsInfo, accountId };
  } catch (error) {
    console.warn(`[payouts] Couldn't load Stripe account ${accountId}:`, error);
    return { connected: true, ready: false, needsInfo: true, accountId };
  }
}

/* ---------- Payout records (on rentals) ---------- */

export interface PayoutRow {
  id: string | number;
  start_date: string;
  end_date: string;
  payout_status: string | null;
  payout_amount: number | null;
  paid_out_at: string | null;
  item: string;
}

/** A vendor's recent and upcoming payouts. */
export async function getVendorPayouts(vendorId: string): Promise<PayoutRow[]> {
  try {
    const rows = (await asServer(
      readItems("rentals", {
        fields: ["id", "start_date", "end_date", "payout_status", "payout_amount", "paid_out_at", { prop_id: ["name"] }],
        filter: {
          _and: [
            { kind: { _eq: "booking" } },
            { prop_id: { user_created: { _eq: vendorId } } },
            { payout_status: { _in: ["pending", "paid"] } },
          ],
        },
        sort: ["-end_date"],
        limit: 50,
      })
    )) as unknown as (Omit<PayoutRow, "item"> & { prop_id: { name: string } | null })[];
    return rows.map((r) => ({ ...r, item: r.prop_id?.name ?? "Item" }));
  } catch (error) {
    console.warn("[payouts] Couldn't load payouts:", error);
    return [];
  }
}

/* ---------- Sending payouts (daily job) ---------- */

interface DueRental {
  id: string | number;
  start_date: string;
  end_date: string;
  payout_amount: number | null;
  stripe_payment_id: string | null;
  prop_id: {
    name: string;
    user_created: { id: string; email: string | null; shop_name: string | null; first_name: string | null } | null;
  } | null;
}

/**
 * Pay vendors for rentals whose return date has passed. Each transfer uses an
 * idempotency key, so a rental can never be paid twice.
 */
export async function sendDuePayouts() {
  const result = { paid: 0, skipped: 0, errors: 0 };
  const due = (await asServer(
    readItems("rentals", {
      fields: [
        "id",
        "start_date",
        "end_date",
        "payout_amount",
        "stripe_payment_id",
        { prop_id: ["name", { user_created: ["id", "email", "shop_name", "first_name"] }] },
      ],
      filter: {
        _and: [
          { kind: { _eq: "booking" } },
          { payout_status: { _eq: "pending" } },
          { end_date: { _lt: todayIso() } },
        ],
      },
      limit: 200,
    })
  )) as unknown as DueRental[];

  for (const rental of due) {
    try {
      const vendor = rental.prop_id?.user_created;
      const amount = Number(rental.payout_amount) || 0;
      if (!vendor || amount <= 0 || !rental.stripe_payment_id) {
        result.skipped++;
        console.warn(`[payouts] Rental ${rental.id} can't be paid out (missing vendor, amount or payment)`);
        continue;
      }
      const account = await getPayoutAccountStatus(vendor.id);
      if (!account.ready || !account.accountId) {
        result.skipped++;
        console.warn(`[payouts] Vendor ${vendor.id} isn't set up for payouts yet; rental ${rental.id} stays pending`);
        continue;
      }

      // Tie the transfer to the original charge, so it works even before funds settle
      const intent = await stripe.paymentIntents.retrieve(rental.stripe_payment_id);
      const charge = typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id;

      const transfer = await stripe.transfers.create(
        {
          amount: Math.round(amount * 100),
          currency: "usd",
          destination: account.accountId,
          ...(charge ? { source_transaction: charge } : {}),
          description: `${rental.prop_id?.name ?? "Rental"} · ${rental.start_date} – ${rental.end_date}`,
          metadata: { rental_id: String(rental.id) },
        },
        { idempotencyKey: `payout-rental-${rental.id}` }
      );

      await asServer(
        updateItem("rentals", rental.id, {
          payout_status: "paid",
          payout_transfer_id: transfer.id,
          paid_out_at: new Date().toISOString(),
        })
      );
      await emailVendorPayoutSent({
        to: vendor.email,
        shop: vendor.shop_name || vendor.first_name || "there",
        item: rental.prop_id?.name ?? "your item",
        dates: `${formatDate(rental.start_date)} – ${formatDate(rental.end_date)}`,
        amount: formatMoney(amount),
      });
      result.paid++;
    } catch (error) {
      result.errors++;
      console.error(`[payouts] Payout for rental ${rental.id} failed:`, error);
    }
  }
  return result;
}
