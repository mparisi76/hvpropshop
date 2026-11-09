import { AlertCircle } from "lucide-react";

/** Shown on request pages when the vendor can't accept yet. */
export default function PayoutsBanner({ connected }: { connected: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="flex items-start gap-2 text-sm text-amber-900">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {connected
          ? "Finish your Stripe setup to accept requests. That's how you get paid."
          : "Connect Stripe to accept requests. That's how you get paid."}
      </p>
      <a href="/dashboard/payouts/connect" className="btn-accent h-9!">
        {connected ? "Finish Stripe setup" : "Connect with Stripe"}
      </a>
    </div>
  );
}
