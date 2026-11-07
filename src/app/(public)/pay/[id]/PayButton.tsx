"use client";

import { useState, useTransition } from "react";
import { Loader2, Lock } from "lucide-react";
import { startCheckout } from "./actions";

export default function PayButton({ id, token, label }: { id: string; token: string; label: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const result = await startCheckout(id, token);
            if (result?.error) setError(result.error);
          })
        }
        className="btn-accent h-11! w-full"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {pending ? "Opening secure checkout…" : label}
      </button>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <p className="text-center text-xs text-neutral-500">Secure payment via Stripe.</p>
    </div>
  );
}
