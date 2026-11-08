"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { acceptRequest, cancelAsVendor, declineRequest } from "../actions";

/** Accept / Decline (for new requests) or Cancel (for accepted/paid bookings). */
export default function RequestDecision({
  id,
  mode,
  paid,
  totalLabel,
  customerFirstName,
}: {
  id: string;
  mode: "respond" | "cancel";
  paid: boolean;
  totalLabel: string;
  customerFirstName: string;
}) {
  const [step, setStep] = useState<"idle" | "declining" | "cancelling">("idle");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const run = (which: string, fn: () => Promise<{ error?: string }>) => {
    setBusy(which);
    start(async () => {
      setError(null);
      const result = await fn();
      if (result.error) setError(result.error);
      setBusy(null);
    });
  };

  if (mode === "respond" && step === "idle") {
    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={pending}
            onClick={() => run("accept", () => acceptRequest(id))}
            className="btn-accent h-11! flex-1"
          >
            {busy === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Accept
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setStep("declining")}
            className="btn-secondary h-11! flex-1"
          >
            <X className="h-4 w-4" /> Decline
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          Accepting holds the item and emails {customerFirstName} a link to pay. Nothing is charged until they do.
        </p>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      </div>
    );
  }

  if (mode === "cancel" && step === "idle") {
    return (
      <button type="button" onClick={() => setStep("cancelling")} className="btn-secondary">
        Cancel booking
      </button>
    );
  }

  const declining = step === "declining";
  return (
    <div className={`space-y-3 rounded-md border p-4 ${declining ? "border-neutral-200 bg-white" : "border-red-200 bg-red-50/50"}`}>
      {!declining && (
        <p className="text-sm text-neutral-800">
          {paid
            ? `${customerFirstName} will be refunded ${totalLabel} in full and the dates freed up.`
            : `${customerFirstName} hasn't paid yet. Cancelling releases the hold.`}
        </p>
      )}
      <div>
        <label htmlFor="decision-reason" className="label">
          {declining ? "Reason for declining" : "Reason for cancelling"}{" "}
          <span className="font-normal text-neutral-500">(optional, sent to {customerFirstName})</span>
        </label>
        <textarea
          id="decision-reason"
          rows={3}
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={declining ? "e.g. Already out on another job those dates" : ""}
          className="input resize-none"
        />
      </div>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {declining ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("decline", () => declineRequest(id, reason))}
            className="btn-primary"
          >
            {busy === "decline" && <Loader2 className="h-4 w-4 animate-spin" />} Decline request
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("cancel", () => cancelAsVendor(id, reason))}
            className="btn bg-red-600 text-white hover:bg-red-700"
          >
            {busy === "cancel" && <Loader2 className="h-4 w-4 animate-spin" />}
            {paid ? "Cancel and refund" : "Cancel booking"}
          </button>
        )}
        <button type="button" disabled={pending} onClick={() => setStep("idle")} className="btn-ghost">
          {declining ? "Back" : "Keep booking"}
        </button>
      </div>
    </div>
  );
}
