"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cancelAsCustomer } from "./actions";

export default function CancelSection({
  id,
  token,
  outcome,
}: {
  id: string;
  token: string;
  /** What happens if they cancel now, e.g. "You'll be refunded $340 in full." */
  outcome: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <section className="mt-10 border-t border-neutral-200 pt-6">
      <h2 className="text-sm font-semibold">Need to cancel?</h2>
      <p className="mt-1 text-sm text-neutral-600">{outcome}</p>
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="btn-secondary mt-3">
          Cancel booking
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError(null);
                  const result = await cancelAsCustomer(id, token);
                  if (result.error) setError(result.error);
                })
              }
              className="btn bg-red-600 text-white hover:bg-red-700"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} Yes, cancel it
            </button>
            <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="btn-ghost">
              Keep my booking
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
