import { CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/bookings";
import { getPayoutAccountStatus, getVendorPayouts, PLATFORM_FEE_RATE } from "@/lib/payouts";

/** Stripe Connect status + payout history for the logged-in vendor (Shop page). */
export default async function PayoutsSection({
  vendorId,
  notice,
}: {
  vendorId: string;
  /** From ?payouts= after returning from Stripe */
  notice?: string;
}) {
  const [status, payouts] = await Promise.all([getPayoutAccountStatus(vendorId), getVendorPayouts(vendorId)]);
  const fee = Math.round(PLATFORM_FEE_RATE * 100);
  const upcoming = payouts.filter((p) => p.payout_status === "pending");
  const paid = payouts.filter((p) => p.payout_status === "paid").slice(0, 10);

  return (
    <section id="payouts" className="card mt-6 scroll-mt-24 space-y-4 p-6">
      <div>
        <h2 className="text-base font-semibold">Payouts</h2>
        <p className="text-sm text-neutral-500">
          Customers pay through HV Prop Shop. You receive {100 - fee}% of each booking ({fee}% commission), sent to
          your Stripe account the day after the return date.
        </p>
      </div>

      {notice === "error" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          We couldn&apos;t open Stripe just now. Please try again.
        </p>
      )}

      {status.ready ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-green-200 bg-accent-soft px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-accent">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Payouts are set up
            {status.needsInfo && <span className="font-normal text-amber-800">· Stripe needs a few more details</span>}
          </p>
          <div className="flex gap-2">
            {status.needsInfo && (
              <a href="/dashboard/payouts/connect" className="btn-secondary h-9!">
                Update details
              </a>
            )}
            <a href="/dashboard/payouts/stripe" target="_blank" className="btn-secondary h-9!">
              Stripe dashboard <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="flex items-start gap-2 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {status.connected
              ? "Finish setting up your Stripe account to start accepting requests and getting paid."
              : "Connect a Stripe account to accept requests and get paid. It takes a few minutes: Stripe asks for your details and a bank account."}
          </p>
          <a href="/dashboard/payouts/connect" className="btn-accent">
            {status.connected ? "Finish Stripe setup" : "Connect with Stripe"}
          </a>
        </div>
      )}

      {(upcoming.length > 0 || paid.length > 0) && (
        <div className="overflow-hidden rounded-md border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">Booking</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {[...upcoming, ...paid].map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium">{p.item}</p>
                    <p className="text-xs text-neutral-500">
                      {formatDate(p.start_date)} – {formatDate(p.end_date)}
                    </p>
                  </td>
                  <td className="px-3 py-2 text-neutral-600">
                    {p.payout_status === "paid"
                      ? `Paid ${p.paid_out_at ? formatDate(p.paid_out_at) : ""}`
                      : `Scheduled after ${formatDate(p.end_date)}`}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(p.payout_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
